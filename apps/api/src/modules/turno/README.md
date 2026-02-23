# Módulo Turno

Manual completo do módulo de **Turno**, **Checklist Preenchido** e **Turno Realizado**: arquitetura, fluxos, payloads e referência de API.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Modelo de dados](#3-modelo-de-dados)
4. [Rotas e payloads](#4-rotas-e-payloads)
5. [Fluxos principais](#5-fluxos-principais)
6. [Validações](#6-validações)
7. [Eventos e tarefas assíncronas](#7-eventos-e-tarefas-assíncronas)
8. [Estrutura de arquivos](#8-estrutura-de-arquivos)

---

## 1. Visão geral

| Conceito                 | Descrição                                                        | Tabelas                                                                                       |
| ------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Turno**                | Jornada operacional: veículo, equipe, eletricistas, km, datas    | `Turno`, `TurnoEletricistas`                                                                  |
| **Checklist preenchido** | Respostas dos checklists durante o turno (abertura)              | `ChecklistPreenchidos`, `ChecklistRespostas`, `ChecklistPendencias`, `ChecklistRespostaFotos` |
| **Turno realizado**      | Registro de quem trabalhou no dia (escala, faltas, horas extras) | `TurnoRealizado`, `TurnoRealizadoEletricista`                                                 |

- **Turno**: o que o app mobile/backoffice abre e fecha (veículo, equipe, km, datas).
- **Turno realizado**: quem de fato abriu/fechou turno naquele dia; usado em relatórios de frequência e reconciliação.
- **Checklist preenchido**: respostas dos checklists na abertura; podem gerar **pendências** e **fotos** (enviadas depois).

---

## 2. Arquitetura

### Diagrama de componentes

```bash
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TurnoController                                   │
│  POST /turno/abrir  │  POST /turno/fechar  │  GET /turno  │  GET /turno/sync  │  GET /turno/:id  │
└─────────────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Use Cases                                     │
│  OpenTurnoUseCase │ CloseTurnoUseCase │ ListTurnosUseCase │ GetTurnoUseCase │ SyncTurnosUseCase │
└─────────────────────────────────────────┬───────────────────────────────────┘
          │                               │
          │ transação                     │ evento (assíncrono)
          ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────────┐
│  TurnoRepository             │    │  EventEmitter2.emit('turno.aberto')      │
│  ChecklistPreenchidoService  │    └─────────────────────────────────────────┘
└──────────────────────────────┘                          │
                                                  ├──────────────────────────────┐
                                                  ▼                              ▼
                                    ┌──────────────────────────┐  ┌──────────────────────────────┐
                                    │ AbrirTurnoRealizado      │  │ ProcessarChecklist           │
                                    │ Listener                 │  │ Listener                     │
                                    │ → TurnoRealizadoService  │  │ → ChecklistPreenchidoService │
                                    │   .abrirTurno()          │  │   .processarChecklistsAssincrono()      │
                                    └──────────────────────────┘  │                             │
                                                                  └──────────────────────────────┘
```

### Fluxo de responsabilidades

| Componente                     | Responsabilidade                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **TurnoController**            | Recebe requisições HTTP e retorna respostas padronizadas                                            |
| **Use Cases**                  | Orquestram abertura, fechamento, listagem, detalhe e sync                                           |
| **TurnoRepository**            | Persistência de Turno e TurnoEletricistas                                                           |
| **ChecklistPreenchidoService** | Persistência e processamento assíncrono de checklists                                               |
| **TurnoRealizadoService**      | Criação e fechamento de TurnoRealizado/TurnoRealizadoEletricista (uso interno; sem controller REST) |
| **Listeners**                  | Reagem ao evento `turno.aberto` de forma assíncrona (sem bloquear a resposta)                       |

---

## 3. Modelo de dados

### Turno

| Campo                | Tipo      | Descrição                  |
| -------------------- | --------- | -------------------------- |
| id                   | number    | PK                         |
| dataSolicitacao      | DateTime  | Momento da solicitação     |
| dataInicio           | DateTime  | Início do turno            |
| dataFim              | DateTime? | Fim (null = ABERTO)        |
| veiculoId            | number    | FK Veiculo                 |
| equipeId             | number    | FK Equipe                  |
| dispositivo          | string    | ID do dispositivo (mobile) |
| kmInicio             | number    | Quilometragem inicial      |
| KmFim                | number?   | Quilometragem final        |
| createdBy, updatedBy | string    | Auditoria                  |

**Status**: derivado de `dataFim` — `null` = ABERTO, preenchido = FECHADO.

### TurnoEletricista

| Campo         | Tipo    | Descrição                  |
| ------------- | ------- | -------------------------- |
| turnoId       | number  | FK Turno                   |
| eletricistaId | number  | FK Eletricista             |
| motorista     | boolean | Se é o motorista da equipe |

### TurnoRealizado

| Campo               | Tipo     | Descrição                              |
| ------------------- | -------- | -------------------------------------- |
| dataReferencia      | DateTime | Data de referência (dia)               |
| equipeId            | number   | FK Equipe                              |
| turnoId             | number?  | FK Turno (quando criado pela abertura) |
| origem              | string   | `mobile` ou `backoffice`               |
| abertoEm, fechadoEm | DateTime | Horários de abertura/fechamento        |

### ChecklistPreenchido

| Campo               | Tipo     | Descrição                    |
| ------------------- | -------- | ---------------------------- |
| uuid                | string   | UUID único do app (36 chars) |
| turnoId             | number   | FK Turno                     |
| checklistId         | number   | FK Checklist (modelo)        |
| eletricistaId       | number   | Quem preencheu               |
| dataPreenchimento   | DateTime | Momento do preenchimento     |
| latitude, longitude | number?  | Geolocalização               |

### ChecklistResposta

| Campo              | Tipo    | Descrição                                 |
| ------------------ | ------- | ----------------------------------------- |
| perguntaId         | number  | FK ChecklistPergunta                      |
| opcaoRespostaId    | number  | Opção escolhida                           |
| aguardandoFoto     | boolean | Se aguarda foto (opção com geraPendencia) |
| fotosSincronizadas | number  | Contador de fotos enviadas                |

---

## 4. Rotas e payloads

Base path: `/turno` (ou `/api/turno` conforme configuração da API). Todas as rotas requerem autenticação (Bearer token).

### 4.1 Abrir turno

**`POST /turno/abrir`**

Payload de entrada:

```json
{
  "veiculoId": 1,
  "equipeId": 10,
  "dispositivo": "device-abc-123",
  "kmInicio": 12345,
  "dataInicio": "2025-02-05T08:00:00.000Z",
  "eletricistas": [
    { "eletricistaId": 42, "motorista": true },
    { "eletricistaId": 43, "motorista": false }
  ],
  "checklists": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "checklistId": 1,
      "eletricistaId": 42,
      "latitude": -23.5505,
      "longitude": -46.6333,
      "respostas": [
        { "perguntaId": 1, "opcaoRespostaId": 2 },
        { "perguntaId": 2, "opcaoRespostaId": 5 }
      ]
    }
  ]
}
```

| Campo        | Obrigatório | Tipo       | Descrição                                       |
| ------------ | ----------- | ---------- | ----------------------------------------------- |
| veiculoId    | sim         | number     | ID do veículo                                   |
| equipeId     | sim         | number     | ID da equipe                                    |
| dispositivo  | sim         | string     | Identificação do dispositivo                    |
| kmInicio     | sim         | number     | Quilometragem inicial                           |
| dataInicio   | não         | Date (ISO) | Padrão: agora                                   |
| eletricistas | sim         | array      | Pelo menos um; exatamente um com motorista=true |
| checklists   | não         | array      | Checklists preenchidos com respostas            |

**Estrutura de `eletricistas`:**

| Campo         | Obrigatório | Tipo    | Descrição         |
| ------------- | ----------- | ------- | ----------------- |
| eletricistaId | sim         | number  | ID do eletricista |
| motorista     | não         | boolean | Se é o motorista  |

**Estrutura de `checklists` (item):**

| Campo               | Obrigatório | Tipo          | Descrição                  |
| ------------------- | ----------- | ------------- | -------------------------- |
| uuid                | sim         | string (UUID) | Gerado pelo app            |
| checklistId         | sim         | number        | ID do modelo de checklist  |
| eletricistaId       | sim         | number        | Quem preencheu             |
| latitude, longitude | não         | number        | Coordenadas                |
| respostas           | sim         | array         | Pergunta + opção escolhida |

**Estrutura de `respostas` (item):**

| Campo           | Obrigatório | Tipo   | Descrição             |
| --------------- | ----------- | ------ | --------------------- |
| perguntaId      | sim         | number | ID da pergunta        |
| opcaoRespostaId | sim         | number | ID da opção escolhida |

Resposta de sucesso (200):

```json
{
  "success": true,
  "message": "Turno aberto com sucesso",
  "data": {
    "id": 123,
    "dataInicio": "2025-02-05T08:00:00.000Z",
    "dataFim": null,
    "status": "ABERTO",
    "kmInicio": 12345,
    "kmFim": null,
    "veiculo": { "id": 1, "nome": "ABC-1234" },
    "equipe": { "id": 10, "nome": "Equipe Alpha" },
    "remoteId": 123,
    "checklistsSalvos": 1,
    "respostasAguardandoFoto": [101, 102],
    "processamentoAssincrono": "Em andamento"
  }
}
```

Quando há checklists com respostas que geram pendência (`geraPendencia=true`), `respostasAguardandoFoto` lista os IDs de `ChecklistResposta` que aguardam foto. O app pode enviar fotos depois via módulo de upload (tipo `checklist-reprova`).

---

### 4.2 Fechar turno

**`POST /turno/fechar`** (mobile – turnoId no body)

```json
{
  "turnoId": 123,
  "kmFim": 12400,
  "dataFim": "2025-02-05T18:00:00.000Z",
  "latitude": "-23.5505",
  "longitude": "-46.6333"
}
```

**`PATCH /turno/:id/fechar`** (turnoId na rota)

Body:

```json
{
  "kmFim": 12400,
  "dataFim": "2025-02-05T18:00:00.000Z"
}
```

| Campo               | Obrigatório | Tipo       | Descrição                     |
| ------------------- | ----------- | ---------- | ----------------------------- |
| turnoId             | sim (POST)  | number     | ID do turno                   |
| kmFim / kmFinal     | não         | number     | Quilometragem final           |
| dataFim / horaFim   | não         | Date (ISO) | Padrão: agora                 |
| latitude, longitude | não         | string     | Coordenadas (compatibilidade) |

Resposta:

```json
{
  "success": true,
  "message": "Turno fechado com sucesso",
  "data": {
    "id": 123,
    "dataInicio": "2025-02-05T08:00:00.000Z",
    "dataFim": "2025-02-05T18:00:00.000Z",
    "status": "FECHADO",
    "kmInicio": 12345,
    "kmFim": 12400,
    "veiculo": { "id": 1, "nome": "ABC-1234" },
    "equipe": { "id": 10, "nome": "Equipe Alpha" }
  }
}
```

---

### 4.3 Listar turnos

**`GET /turno`**

Query params:

| Parâmetro      | Tipo       | Descrição                        |
| -------------- | ---------- | -------------------------------- |
| page           | number     | Página (default: 1)              |
| limit          | number     | Tamanho (default: 20)            |
| veiculoId      | number     | Filtrar por veículo              |
| equipeId       | number     | Filtrar por equipe               |
| eletricistaId  | number     | Filtrar por eletricista          |
| status         | string     | `ABERTO` ou `FECHADO`            |
| dataInicioFrom | Date (ISO) | Data início mínima               |
| dataInicioTo   | Date (ISO) | Data início máxima               |
| search         | string     | Busca em placa ou nome da equipe |

Exemplo: `GET /turno?status=ABERTO&page=1&limit=10`

Resposta:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "dataInicio": "2025-02-05T08:00:00.000Z",
        "dataFim": null,
        "status": "ABERTO",
        "kmInicio": 12345,
        "kmFim": null,
        "veiculo": { "id": 1, "nome": "ABC-1234" },
        "equipe": { "id": 10, "nome": "Equipe Alpha" }
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 10 }
  }
}
```

---

### 4.4 Obter detalhe do turno

**`GET /turno/:id`**

Retorna turno com eletricistas, checklists e turnos realizados.

```json
{
  "success": true,
  "data": {
    "id": 123,
    "dataInicio": "2025-02-05T08:00:00.000Z",
    "dataFim": null,
    "status": "ABERTO",
    "kmInicio": 12345,
    "kmFim": null,
    "dispositivo": "device-abc-123",
    "createdAt": "2025-02-05T08:00:05.000Z",
    "updatedAt": null,
    "createdBy": "system",
    "updatedBy": null,
    "veiculo": { "id": 1, "nome": "ABC-1234" },
    "equipe": { "id": 10, "nome": "Equipe Alpha" },
    "eletricistas": [
      { "eletricistaId": 42, "motorista": true },
      { "eletricistaId": 43, "motorista": false }
    ],
    "checklists": [],
    "turnosRealizados": []
  }
}
```

---

### 4.5 Sincronizar turnos (mobile)

**`GET /turno/sync`**

Query params:

| Parâmetro | Tipo         | Descrição                                  |
| --------- | ------------ | ------------------------------------------ |
| since     | string (ISO) | Retornar turnos atualizados após essa data |
| limit     | number       | Limite de itens                            |

Exemplo: `GET /turno/sync?since=2025-02-01T00:00:00.000Z&limit=50`

Retorna lista de turnos com detalhes (formato `TurnoDetalheDto[]`) no envelope padrão (`{ success, data }`).

---

## 5. Fluxos principais

### 5.1 Abertura de turno (com checklists)

1. Cliente envia `POST /turno/abrir` com turno e checklists.
2. `OpenTurnoUseCase.execute()`:
   - Valida (veículo, equipe, eletricistas, conflitos).
   - Transação: cria `Turno`, `TurnoEletricistas`, `ChecklistPreenchidos` e `ChecklistRespostas`.
3. Após commit, emite evento `turno.aberto` (não bloqueia).
4. Retorna resposta imediata com `remoteId`, `checklistsSalvos`, `respostasAguardandoFoto`.
5. Listeners (assíncronos):
   - **AbrirTurnoRealizadoListener**: cria `TurnoRealizado` e `TurnoRealizadoEletricista`.
   - **ProcessarChecklistListener**: cria `ChecklistPendencias` e marca `aguardandoFoto` nas respostas com `geraPendencia=true`.

### 5.2 Fechamento de turno

1. Cliente envia `POST /turno/fechar` ou `PATCH /turno/:id/fechar`.
2. `CloseTurnoUseCase.execute()`:
   - Valida (turno existe, aberto, km e datas consistentes).
   - Atualiza `Turno` (dataFim, KmFim).
   - Chama `TurnoRealizadoService.fecharTurnoPorTurnoId()` para fechar o Turno Realizado vinculado.

### 5.3 Sincronização de fotos de checklist

1. App possui `checklistRespostaId` (ex.: de `respostasAguardandoFoto`).
2. Envia foto via módulo Upload: `POST /upload` com `type=checklist-reprova`, `entityId` (checklistPreenchidoId ou UUID), `turnoId`, `checklistPerguntaId`.
3. O handler `ChecklistReprovaEvidenceHandler` (módulo Upload) cria `ChecklistRespostaFoto`, associa à pendência (se existir) e incrementa `fotosSincronizadas`.

---

## 6. Validações

### Abertura

| Regra                                     | Erro                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Veículo existe                            | `Veículo não encontrado`                                                    |
| Equipe existe                             | `Equipe não encontrada`                                                     |
| Pelo menos um eletricista                 | `Pelo menos um eletricista é obrigatório`                                   |
| Um eletricista como motorista             | `Informe um eletricista como motorista`                                     |
| Sem conflito (veículo/equipe/eletricista) | `Já existe um turno aberto para o veículo, equipe ou eletricista neste dia` |

Conflito: turno aberto (`dataFim` null) no mesmo dia (00:00–23:59) para o mesmo veículo, equipe ou qualquer eletricista informado.

### Fechamento

| Regra                 | Erro                                               |
| --------------------- | -------------------------------------------------- |
| turnoId informado     | `turnoId é obrigatório`                            |
| Turno existe          | `Turno não encontrado`                             |
| Turno aberto          | `O turno já está fechado`                          |
| kmFim >= kmInicio     | `Quilometragem final deve ser maior que a inicial` |
| dataFim >= dataInicio | `Data fim não pode ser anterior à data início`     |

---

## 7. Eventos e tarefas assíncronas

O módulo usa `@nestjs/event-emitter` (EventEmitter2).

### Evento `turno.aberto`

Emitido após a transação de abertura ser concluída. Payload:

```ts
TurnoAbertoEvent {
  turnoId: number;
  equipeId: number;
  dataReferencia: Date;
  eletricistas: { eletricistaId: number; motorista?: boolean }[];
  dispositivo: string;
  checklistPreenchidoIds: number[];
  respostasAguardandoFoto: number[];
}
```

### Listeners

| Listener                        | Ação                                                                  |
| ------------------------------- | --------------------------------------------------------------------- |
| **AbrirTurnoRealizadoListener** | Cria `TurnoRealizado` e `TurnoRealizadoEletricista`                   |
| **ProcessarChecklistListener**  | Executa `processarChecklistsAssincrono` (pendências + aguardandoFoto) |

Ambos são assíncronos: a resposta HTTP é enviada antes da conclusão. Erros nos listeners são logados pelo `ProcessarChecklistListener`.

---

## 8. Estrutura de arquivos

```bash
src/modules/turno/
├── README.md
├── turno.module.ts
├── turno.controller.ts
├── turno.repository.ts
├── turno.validation.ts
├── application/
│   └── use-cases/
│       ├── open-turno.use-case.ts
│       ├── close-turno.use-case.ts
│       ├── list-turnos.use-case.ts
│       ├── get-turno.use-case.ts
│       └── sync-turnos.use-case.ts
├── domain/
│   └── repositories/
│       └── turno-repository.port.ts
├── dto/
│   ├── abrir-turno.dto.ts
│   ├── fechar-turno.dto.ts
│   ├── turno-query.dto.ts
│   ├── turno-response.dto.ts
│   ├── turno-detalhe.dto.ts
│   └── checklist-preenchido.dto.ts
├── events/
│   └── turno-aberto.event.ts
├── listeners/
│   ├── abrir-turno-realizado.listener.ts
│   └── processar-checklist.listener.ts
├── turno-realizado/
│   └── turno-realizado.service.ts
└── checklist-preenchido/
    └── checklist-preenchido.service.ts
```

### Dependências do módulo

- `DatabaseModule` (Prisma)
- `LoggerModule` (AppLogger)
- `UploadModule` (fotos de checklist via `checklist-reprova`)
- `EventEmitterModule` (configurado no AppModule)

---

## Referência rápida de erros HTTP

| Status | Código     | Situação                                 |
| ------ | ---------- | ---------------------------------------- |
| 400    | VALIDATION | Dados inválidos (validações de negócio)  |
| 404    | NOT_FOUND  | Turno não encontrado                     |
| 409    | CONFLICT   | Turno já fechado ou conflito de abertura |

Para detalhes de formato de erro, ver `AppError` e `GlobalExceptionFilter` no core da aplicação.
