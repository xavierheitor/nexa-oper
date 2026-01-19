# Módulo Checklist

Este módulo gerencia listagem e sincronização de checklists. Criação, atualização e exclusão são feitas **somente no web**.

## Estrutura

```bash
checklist/
├── controllers/
│   ├── checklist.controller.ts      # Listagem (findAll, findOne, count)
│   ├── checklist-sync.controller.ts # Sync mobile (status, 7 payloads com since)
│   └── index.ts
├── services/
│   ├── checklist.service.ts         # Listagem e contagem
│   ├── checklist-sync.service.ts    # Checksum, getSyncStatus, 7 findAll*ForSync(since)
│   └── index.ts
├── dto/
│   ├── checklist-response.dto.ts
│   ├── checklist-list-response.dto.ts
│   ├── checklist-query.dto.ts
│   ├── checklist-pergunta-sync.dto.ts
│   ├── checklist-pergunta-relacao-sync.dto.ts
│   ├── checklist-opcao-resposta-sync.dto.ts
│   ├── checklist-opcao-resposta-relacao-sync.dto.ts
│   ├── checklist-tipo-veiculo-relacao-sync.dto.ts
│   ├── checklist-tipo-equipe-relacao-sync.dto.ts
│   └── index.ts
├── checklist.module.ts
└── README.md
```

Constantes: `@common/constants/checklist`.

## ChecklistController (Web)

**Rota base:** `/api/checklist`

- `GET /api/checklist/modelos` - Lista checklists (paginado, busca, filtro por tipo)
- `GET /api/checklist/modelos/:id` - Busca checklist por ID
- `GET /api/checklist/modelos/count` - Conta total de checklists ativos

## ChecklistSyncController (Mobile)

**Rota base:** `/api/checklist/sync`

### Status (checksum)

- `GET /api/checklist/sync/status?checksum=opcional` — `{ changed, checksum, serverTime }`. Se `changed=false`, o mobile pode pular o download.

### Dados (full ou incremental)

- `GET /api/checklist/sync/modelos?since=opcional`
- `GET /api/checklist/sync/perguntas?since=opcional`
- `GET /api/checklist/sync/perguntas/relacoes?since=opcional`
- `GET /api/checklist/sync/opcoes-resposta?since=opcional`
- `GET /api/checklist/sync/opcoes-resposta/relacoes?since=opcional`
- `GET /api/checklist/sync/tipos-veiculo/relacoes?since=opcional`
- `GET /api/checklist/sync/tipos-equipe/relacoes?since=opcional`

**`since`** (opcional): ISO 8601. Se presente, retorna apenas registros alterados (`updatedAt > since`) ou deletados (`deletedAt > since`). Respostas incluem `updatedAt` e `deletedAt`.

## Serviços

- **ChecklistService:** `findAll`, `findOne`, `count`
- **ChecklistSyncService:** `getSyncStatus(checksum?)`, `findAllForSync(since?)`, `findAllPerguntasForSync(since?)`, `findAllPerguntaRelacoesForSync(since?)`, `findAllOpcoesForSync(since?)`, `findAllOpcaoRelacoesForSync(since?)`, `findAllTipoVeiculoRelacoesForSync(since?)`, `findAllTipoEquipeRelacoesForSync(since?)`

## Fluxo mobile (sugerido)

1. `GET /api/checklist/sync/status?checksum={último}` → se `changed=false`, não baixar.
2. Se `changed=true`: chamar os 7 endpoints de dados com `?since={lastSync}` (incremental) ou sem `since` (full).
3. Aplicar dados; para itens com `deletedAt` definido, remover localmente.
4. Gravar `checksum` e `serverTime` como `lastSync`.

## Exemplos

```bash
# Status
GET /api/checklist/sync/status?checksum=abc...

# Full sync
GET /api/checklist/sync/modelos

# Incremental
GET /api/checklist/sync/modelos?since=2024-01-15T00:00:00.000Z
```
