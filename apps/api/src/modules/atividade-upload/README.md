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
- `aprs` (opcional) com respostas e assinaturas da APR preenchida
- `fotos` (opcional, em base64) e/ou fotos inline em `medidor` e `respostas`

## Comportamento

- Idempotência por `atividadeUuid` (`upsert`)
- Idempotência por `aprUuid` dentro de `aprs`
- Persistência de fotos em storage configurado (`local`/`s3`)
- Persistência transacional de medidor, materiais, respostas, eventos e APR
- APR vinculada obrigatoriamente a um `turno` e opcionalmente ao serviço (`vinculadaAoServico`)
- Validação de assinaturas: todos os componentes do turno precisam assinar cada APR (aceita assinantes extras)
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
