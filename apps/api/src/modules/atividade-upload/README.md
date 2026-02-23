# Módulo Atividade Upload

Recebe upload de atividades executadas pelo app mobile.

## Endpoint

- `POST /api/mobile/uploads/activities`

## Payload

Um único JSON com:
- dados da execução (`atividadeUuid`, `turnoId`, status, etapa)
- `medidor` (opcional)
- `materiais` (opcional)
- `respostas` (opcional)
- `eventos` (opcional)
- `fotos` (opcional, em base64) e/ou fotos inline em `medidor` e `respostas`

## Comportamento

- Idempotência por `atividadeUuid` (`upsert`)
- Persistência de fotos em storage configurado (`local`/`s3`)
- Persistência transacional de medidor, materiais, respostas e eventos
- Retorno `201` quando cria e `200` quando atualiza

## Resposta

```json
{
  "status": "ok",
  "atividadeExecucaoId": 123,
  "atividadeUuid": "550e8400-e29b-41d4-a716-446655440000",
  "alreadyExisted": false,
  "savedPhotos": 2
}
```
