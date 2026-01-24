# Módulo Equipe

Listagem e sincronização de equipes. Criação, atualização e exclusão são feitas **somente no web**. O sync respeita permissões de contrato do usuário.

## Estrutura

- **EquipeController:** listagem (findAll, findOne, count). Filtro por contratos.
- **EquipeSyncController:** status (checksum), sync full/incremental (?since=).
- **EquipeService:** findAll, findOne, count, buildWhereClause.
- **EquipeSyncService:** getSyncStatus(checksum?, allowedContractIds?), findAllForSync(since?, allowedContractIds?).

## EquipeController (Web)

**Rota base:** `/api/equipes`

- `GET /api/equipes` - Lista equipes (paginado, busca, tipoEquipeId, contratoId). Respeita contratos.
- `GET /api/equipes/count` - Conta ativas.
- `GET /api/equipes/:id` - Busca por ID.

## EquipeSyncController (Mobile)

**Rota base:** `/api/equipes/sync`

### Status (checksum)

- `GET /api/equipes/sync/status?checksum=opcional` — Resposta no DTO **SyncStatusResponseDto** (`changed`, `checksum`, `serverTime`). Escopo pelos contratos do usuário. Se `changed=false`, o mobile pode pular o download.

### Dados

- `GET /api/equipes/sync?since=opcional` — Equipes permitidas. Com `since` (ISO 8601): apenas alteradas/deletadas após a data. Respostas incluem `updatedAt` e `deletedAt`.

## Fluxo mobile (sugerido)

1. `GET /api/equipes/sync/status?checksum={último}` → se `changed=false`, não baixar.
2. Se `changed=true`: `GET /api/equipes/sync?since={lastSync}` (incremental) ou sem `since` (full).
3. Aplicar dados; para itens com `deletedAt` definido, remover localmente.
4. Gravar `checksum` e `serverTime` como `lastSync`.

## Constantes

`@common/constants/equipe` (ORDER_CONFIG, PAGINATION_CONFIG, etc.).
