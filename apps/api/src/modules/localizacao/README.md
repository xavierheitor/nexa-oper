# Módulo Localização

Recebe pontos de localização enviados pelo app mobile e persiste com idempotência por assinatura.

## Arquitetura

- `LocalizacaoController` recebe `POST /mobile/uploads/locations`
- `UploadLocationUseCase` contém regra de negócio
- `LocationUploadRepositoryPort` define a porta de persistência
- `LocalizacaoService` é o adaptador Prisma da porta

## Rota

Com prefixo padrão (`GLOBAL_PREFIX=api`):

- `POST /api/mobile/uploads/locations`

Sem prefixo:

- `POST /mobile/uploads/locations`

## Payload

| Campo             | Obrigatório | Tipo       |
| ----------------- | ----------- | ---------- |
| `turnoId`         | sim         | number     |
| `latitude`        | sim         | number     |
| `longitude`       | sim         | number     |
| `veiculoRemoteId` | não         | number     |
| `equipeRemoteId`  | não         | number     |
| `accuracy`        | não         | number     |
| `provider`        | não         | string     |
| `batteryLevel`    | não         | number     |
| `tagType`         | não         | string     |
| `tagDetail`       | não         | string     |
| `capturedAt`      | não         | string ISO |

## Resposta

- `201 Created`: novo ponto salvo
- `200 OK`: duplicata detectada

Payload:

```json
{
  "status": "ok",
  "alreadyExisted": false
}
```

## Comportamento de negócio

- Gera assinatura SHA256 com campos do payload.
- Se houver violação única por `signature`, retorna sucesso idempotente (`alreadyExisted: true`).
- Se turno não existir ou houver inconsistência referencial, retorna `status: ok` sem quebrar sincronização do app.
- Se turno já estiver fechado, registro ainda é aceito (log de telemetria histórica).

## Contratos públicos

- `src/contracts/localizacao/location-upload.contract.ts`
