# Módulo Turnos

Este módulo gerencia todas as funcionalidades relacionadas aos turnos da operação, incluindo
abertura, fechamento, validações complexas e sincronização para clientes mobile.

## 📁 Estrutura de Arquivos

```bash
turno/
├── constants/
│   ├── turno.constants.ts         # Constantes centralizadas
│   └── index.ts                   # Exportações de constantes
├── controllers/
│   ├── turno.controller.ts        # Controller de abertura/fechamento/CRUD
│   ├── turno-sync.controller.ts   # Controller de sincronização (Mobile)
│   └── index.ts                   # Exportações de controllers
├── services/
│   ├── turno.service.ts           # Regras de negócio de turnos
│   └── index.ts                   # Exportações de serviços
├── dto/
│   ├── abrir-turno.dto.ts         # DTO para abertura de turno
│   ├── fechar-turno.dto.ts        # DTO para fechamento de turno
│   ├── turno-response.dto.ts      # DTO para respostas
│   ├── turno-list-response.dto.ts # DTO para listas paginadas
│   ├── turno-query.dto.ts         # DTO para parâmetros de consulta
│   ├── turno-sync.dto.ts          # DTO para sincronização
│   └── index.ts                   # Exportações de DTOs
├── turno.module.ts                # Módulo principal
├── index.ts                       # Exportações principais
└── README.md                      # Esta documentação
```

## 🎯 Controllers

### TurnoController (Abertura/Fechamento/CRUD)

**Rota base:** `/api/turnos`

Endpoints para operações de turnos:

- `POST /api/turnos/abrir` - Abre um novo turno
- `POST /api/turnos/fechar` - Fecha um turno existente
- `GET /api/turnos` - Lista turnos (paginado)
- `GET /api/turnos/:id` - Busca turno por ID
- `DELETE /api/turnos/:id` - Remove turno

### TurnoSyncController (Sincronização - Mobile)

**Rota base:** `/api/turnos/sync`

Endpoints para sincronização com clientes mobile:

- `GET /api/turnos/sync` - Sincroniza turnos

## 🔧 Services

### TurnoService

Serviço principal que implementa toda a lógica de negócio:

- **Abertura de turnos** com validações de conflito
- **Fechamento de turnos** com validações de negócio
- **Validações de duplicidade** (veículo, equipe, eletricista)
- **Integração com permissões de contrato**
- **Auditoria automática** em todas as operações
- **Sincronização** para mobile
- **Logging estruturado** de operações

## 📊 DTOs

### DTOs de Abertura e Fechamento

- `AbrirTurnoDto` - Dados para abertura de turno
- `EletricistaTurnoDto` - Dados do eletricista no turno
- `FecharTurnoDto` - Dados para fechamento de turno

### DTOs de Resposta

- `TurnoResponseDto` - Resposta individual
- `EletricistaTurnoResponseDto` - Resposta do eletricista
- `TurnoListResponseDto` - Resposta de listagem
- `TurnoQueryDto` - Parâmetros de consulta

### DTOs de Sincronização

- `TurnoSyncDto` - Dados para sincronização mobile
- `EletricistaTurnoSyncDto` - Dados do eletricista para sync

## 🔒 Validações de Negócio

### Abertura de Turno

- ✅ **Não pode haver turno aberto** para o mesmo veículo
- ✅ **Não pode haver turno aberto** para a mesma equipe
- ✅ **Não pode haver turno aberto** para o mesmo eletricista
- ✅ **Data de início** não pode ser muito no futuro (max 24h)
- ✅ **Data de início** não pode ser muito no passado (max 24h)
- ✅ **Validação de existência** de veículo, equipe e eletricistas

### Fechamento de Turno

- ✅ **Turno deve estar aberto** para ser fechado
- ✅ **Quilometragem de fechamento** deve ser maior que a de abertura
- ✅ **Data de fechamento** deve ser posterior à data de abertura
- ✅ **Data de fechamento** não pode ser muito no futuro (max 1h)

## 🚀 Uso

### Exemplo de Abertura de Turno

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "veiculoId": 1,
    "equipeId": 1,
    "dispositivo": "SM-G973F-001",
    "dataInicio": "2024-01-01T08:00:00.000Z",
    "kmInicio": 50000,
    "eletricistas": [
      {"eletricistaId": 1},
      {"eletricistaId": 2}
    ]
  }' \
  "http://localhost:3001/api/turnos/abrir"
```

### Exemplo de Fechamento de Turno

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "turnoId": 1,
    "dataFim": "2024-01-01T17:00:00.000Z",
    "kmFim": 50120
  }' \
  "http://localhost:3001/api/turnos/fechar"
```

### Exemplo de Listagem

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/turnos?page=1&limit=10&status=ABERTO"
```

### Exemplo de Sincronização

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/turnos/sync"
```

## 🔄 Integração

O módulo está integrado com:

- **DatabaseModule** - Acesso ao Prisma
- **AuthModule** - Autenticação e permissões
- **CommonModule** - Utilitários compartilhados

## 📝 Logs

O módulo gera logs estruturados para:

- Abertura de turnos
- Fechamento de turnos
- Validações de conflito
- Erros de negócio
- Sincronizações
- Operações CRUD

## 🎯 Casos de Uso

### 1. Abertura de Turno pelo Mobile

1. App mobile envia solicitação com dados do veículo, equipe, eletricistas
2. API valida se não há conflitos (turno aberto para mesmo veículo/equipe/eletricista)
3. API cria o turno e retorna ID remoto
4. App mobile salva o ID para acompanhamento

### 2. Fechamento de Turno pelo Mobile

1. App mobile envia dados de fechamento (ID do turno, data fim, KM fim)
2. API valida se o turno pode ser fechado
3. API atualiza o turno com dados de fechamento
4. App mobile recebe confirmação

### 3. Sincronização de Dados

1. App mobile solicita sincronização de turnos
2. API retorna todos os turnos ativos
3. App mobile atualiza dados locais
