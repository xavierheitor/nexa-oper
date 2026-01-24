# Módulo Eletricista

Listagem e sincronização de eletricistas. Criação, atualização e exclusão são feitas **somente no web**. O sync respeita permissões de contrato do usuário.

## Estrutura

- **EletricistaController:** listagem (findAll, findOne, count). Filtro por contratos.
- **EletricistaSyncController:** status (checksum), sync full/incremental (?since=).
- **EletricistaService:** findAll, findOne, count, mapQueryDtoToParams.
- **EletricistaSyncService:** getSyncStatus(checksum?, allowedContractIds?), findAllForSync(since?, allowedContractIds?).

## EletricistaController (Web)

**Rota base:** `/api/eletricistas`

- `GET /api/eletricistas` - Lista eletricistas (paginado, busca, estado, contratoId). Respeita contratos.
- `GET /api/eletricistas/count` - Conta ativos.
- `GET /api/eletricistas/:id` - Busca por ID.

## EletricistaSyncController (Mobile)

**Rota base:** `/api/eletricistas/sync`

### Status (checksum)

- `GET /api/eletricistas/sync/status?checksum=opcional` — `{ changed, checksum, serverTime }`. Escopo pelos contratos do usuário. Se `changed=false`, o mobile pode pular o download.

### Dados

- `GET /api/eletricistas/sync?since=opcional` — Eletricistas permitidos. Com `since` (ISO 8601): apenas alterados/deletados após a data. Respostas incluem `updatedAt` e `deletedAt`.

## Fluxo mobile (sugerido)

1. `GET /api/eletricistas/sync/status?checksum={último}` → se `changed=false`, não baixar.
2. Se `changed=true`: `GET /api/eletricistas/sync?since={lastSync}` (incremental) ou sem `since` (full).
3. Aplicar dados; para itens com `deletedAt` definido, remover localmente.
4. Gravar `checksum` e `serverTime` como `lastSync`.

## Constantes

`@common/constants/eletricista` (ORDER_CONFIG, PAGINATION_CONFIG, etc.).
