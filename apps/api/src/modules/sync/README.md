# Módulo Sync

Sincronização de cadastros para o app mobile via manifesto (`ETag`) e coleções em modo `snapshot` ou `delta`.

## Arquitetura

- `SyncController`
  - `GET /sync/manifest`
  - `GET /sync/collections/:name`
- Use cases:
  - `BuildSyncManifestUseCase`
  - `GetSyncCollectionUseCase`
- Porta: `SyncReaderPort` (`SYNC_READER`)
- Adaptador: `SyncService`
- Registry de coleções: `sync-collections.def.ts` + `sync.registry.ts`

## Autenticação e escopo

- Exige JWT.
- Escopo vem de `userId` + contratos permitidos do usuário.
- O `scopeHash` do manifesto muda quando o escopo muda.

## Endpoints

Com prefixo padrão (`GLOBAL_PREFIX=api`):

- `GET /api/sync/manifest`
- `GET /api/sync/collections/:name`

### Manifest

`GET /api/sync/manifest`

- Header opcional: `If-None-Match`
- Retorna `304` quando etag do manifesto não mudou.

Resposta (`200`) no envelope padrão:

```json
{
  "success": true,
  "data": {
    "serverTime": "2026-02-10T00:00:00.000Z",
    "scopeHash": "abc123",
    "collections": {
      "eletricista": { "name": "eletricista", "etag": "...", "mode": "delta" }
    }
  }
}
```

### Collection

`GET /api/sync/collections/:name?since=&until=`

- Para `delta`: usa `since`/`until`
- Para `snapshot`: ignora `since`/`until`

Resposta `snapshot` (envelope):

```json
{
  "success": true,
  "data": {
    "serverTime": "2026-02-10T00:00:00.000Z",
    "nextSince": null,
    "items": [],
    "deletedIds": []
  }
}
```

Resposta `delta` (envelope):

```json
{
  "success": true,
  "data": {
    "serverTime": "2026-02-10T12:00:00.000Z",
    "nextSince": "2026-02-10T12:00:00.000Z",
    "items": [],
    "deletedIds": []
  }
}
```

## Coleções atualmente registradas

- `eletricista` (delta)
- `equipe` (delta)
- `veiculo` (snapshot)
- `tipo-equipe` (delta)
- `tipo-veiculo` (delta)
- `checklist-modelo` (delta)
- `checklist-pergunta` (delta)
- `checklist-pergunta-relacao` (delta)
- `checklist-opcao-resposta` (delta)
- `checklist-opcao-resposta-relacao` (delta)
- `checklist-tipo-veiculo-relacao` (delta)
- `checklist-tipo-equipe-relacao` (delta)
- `atividade-tipo` (snapshot)
- `atividade-tipo-servico` (snapshot)
- `atividade-form-template` (snapshot)
- `atividade-form-pergunta` (snapshot)
- `atividade-form-tipo-servico-relacao` (snapshot)
- `apr-modelo` (snapshot)
- `apr-tipo-atividade-relacao` (snapshot)
- `apr-grupo-pergunta` (snapshot)
- `apr-grupo-relacao` (snapshot)
- `apr-pergunta` (snapshot)
- `apr-grupo-pergunta-relacao` (snapshot)
- `apr-opcao-resposta` (snapshot)
- `apr-grupo-opcao-resposta-relacao` (snapshot)
- `material-catalogo` (snapshot)

## Regra de cliente (resumo)

1. Chamar manifest.
2. Se `304`, não atualizar nada.
3. Se mudou, baixar apenas coleções com etag diferente.
4. Em `delta`: aplicar upsert em `items`, remover `deletedIds`, persistir `nextSince`.
5. Em `snapshot`: substituir conjunto local.

## Contratos públicos

- `src/contracts/sync/sync.contract.ts`
