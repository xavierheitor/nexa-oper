# Módulo Upload

Upload de evidências (imagem/PDF) com validação por tipo, storage plugável e persistência transacional com rollback de arquivo em caso de falha.

## Arquitetura

- `UploadController` expõe endpoints HTTP
- `UploadEvidenceUseCase` e `ListUploadTypesUseCase` executam casos de uso
- `UploadProcessorPort` define porta de processamento (`UPLOAD_PROCESSOR`)
- `UploadService` implementa processamento
- `UploadRegistry` resolve handlers por `type`
- `StorageAdapter` abstrai local/S3

## Rotas

Com prefixo padrão (`GLOBAL_PREFIX=api`):

- `GET /api/upload/types`
- `POST /api/upload` (multipart/form-data)

Sem prefixo: `/upload/types` e `/upload`.

## Regras de upload

- Campos obrigatórios: `file`, `type`, `entityId`
- MIME permitido:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/heic`
  - `image/heif`
  - `application/pdf`
- Limite de tamanho: `UPLOAD_MAX_FILE_SIZE_BYTES`

## Tipos suportados (atual)

| type                   | entityId esperado               | metadados obrigatórios           |
| ---------------------- | ------------------------------- | -------------------------------- |
| `checklist-reprova`    | `checklistPreenchidoId` ou UUID | `turnoId`, `checklistPerguntaId` |
| `checklist-assinatura` | `checklistPreenchidoId` ou UUID | `turnoId`, `sequenciaAssinatura` |
| `atividade-turno`      | `atividadeId`                   | `turnoId`                        |
| `apr-evidence`         | `aprPreenchidoId`               | `turnoId`, `aprPerguntaId`       |
| `medidor`              | `medicaoId` ou `photoId`        | `turnoId`                        |

A lista dinâmica pode ser consultada em `GET /api/upload/types`.

## Fluxo

1. Controller valida presença de arquivo e MIME.
2. `UploadEvidenceUseCase` delega para `UploadService`.
3. `UploadService` normaliza metadata e resolve handler.
4. Handler valida contexto (`validate`) e monta path (`buildStoragePath`).
5. Arquivo é enviado para storage.
6. Handler persiste vínculo de negócio (`persist`).
7. Se persistência falhar, arquivo é removido do storage (best effort) e erro é propagado.

## Storage

`UPLOAD_STORAGE=local|s3`

- `local`: salva em `${UPLOAD_ROOT}` (padrão: `<workspaceRoot>/uploads`) e serve por `/uploads/...` ou `UPLOAD_BASE_URL`
- `s3`: requer bucket/região e credenciais

Variáveis principais:

- `AWS_S3_BUCKET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- opcionais: `AWS_S3_ENDPOINT`, `AWS_S3_PUBLIC_URL`

## Contratos públicos

- `src/contracts/upload/upload.contract.ts`
