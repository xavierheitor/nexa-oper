# Módulo APR (Análise Preliminar de Risco)

Este módulo gerencia listagem e sincronização de modelos de APR para clientes mobile. A criação, atualização e exclusão de APRs, perguntas, opções e relações são feitas **somente no web** (outra aplicação).

## Estrutura de Arquivos

```bash
apr/
├── controllers/
│   ├── apr-sync.controller.ts   # Controller de sincronização (Mobile)
│   └── index.ts
├── services/
│   ├── apr.service.ts           # Regras de negócio de APR (listagem + sync)
│   └── index.ts
├── dto/
│   ├── apr-response.dto.ts
│   ├── apr-list-response.dto.ts
│   ├── apr-query.dto.ts
│   ├── apr-pergunta-sync.dto.ts
│   ├── apr-pergunta-relacao-sync.dto.ts
│   ├── apr-opcao-resposta-sync.dto.ts
│   ├── apr-opcao-resposta-relacao-sync.dto.ts
│   ├── apr-tipo-atividade-relacao-sync.dto.ts
│   └── index.ts
├── apr.module.ts
└── README.md
```

Constantes: `@common/constants/apr`.

## AprSyncController (Sincronização - Mobile)

**Rota base:** `/api/apr/sync`

### Status (checksum)

- `GET /api/apr/sync/status?checksum=opcional` — Verifica se houve mudanças sem baixar os payloads.
  - **Resposta:** `{ changed: boolean, checksum: string, serverTime: string }`
  - Se o cliente envia `checksum` e é igual ao atual: `changed: false` (não é necessário sincronizar).
  - `serverTime` pode ser usado como `since` na próxima sincronização incremental.

### Dados (full ou incremental)

- `GET /api/apr/sync/modelos?since=opcional`
- `GET /api/apr/sync/perguntas?since=opcional`
- `GET /api/apr/sync/perguntas/relacoes?since=opcional`
- `GET /api/apr/sync/opcoes-resposta?since=opcional`
- `GET /api/apr/sync/opcoes-resposta/relacoes?since=opcional`
- `GET /api/apr/sync/tipos-atividade/relacoes?since=opcional`

**Parâmetro `since` (opcional):** data em ISO 8601 (ex: `2024-01-15T00:00:00.000Z`). Se presente, retorna apenas registros **alterados** (`updatedAt > since`) ou **deletados** (`deletedAt > since`) após essa data (sincronização incremental). Sem `since`: full sync (todos os ativos).

**Respostas:** Incluem `updatedAt` e `deletedAt` em cada registro para o mobile aplicar incremental e remover itens deletados. Registros com `deletedAt` preenchido devem ser removidos no cliente.

## Fluxo sugerido no mobile

1. `GET /api/apr/sync/status?checksum={últimoChecksum}`
   - Se `changed === false`: não baixar nada.
   - Se `changed === true`: prosseguir.

2. **Com `lastSync` (since):** chamar os 6 endpoints de dados com `?since={lastSync}` (incremental).
   **Sem `lastSync` (primeira vez):** chamar os 6 endpoints sem `since` (full).

3. Aplicar os dados; para itens com `deletedAt` definido, remover localmente.

4. Gravar `checksum` e `serverTime` da resposta do status como `lastSync` para a próxima incremental.

## Serviços

- **AprService:** `findAll`, `findOne`, `count` (listagem)
- **AprSyncService:** `getSyncStatus(clientChecksum?)`, `findAllForSync(since?)`, `findAllPerguntasForSync(since?)`, `findAllPerguntaRelacoesForSync(since?)`, `findAllOpcoesForSync(since?)`, `findAllOpcaoRelacoesForSync(since?)`, `findAllTipoAtividadeRelacoesForSync(since?)`

## Segurança

- **Autenticação JWT:** Todas as rotas de sync requerem token válido.

## Exemplos

```bash
# Verificar se há mudanças
GET /api/apr/sync/status?checksum=abc123...

# Full sync (modelos)
GET /api/apr/sync/modelos

# Incremental (apenas alterados/deletados após a data)
GET /api/apr/sync/modelos?since=2024-01-15T00:00:00.000Z
```
