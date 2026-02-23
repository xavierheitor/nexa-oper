# Upload de Fotos e Arquivos

## Visão geral

Módulo: `apps/api/src/modules/upload`.

- endpoint: `POST /api/upload` (multipart)
- tipos de evidência por handler (`checklist-reprova`, `checklist-assinatura`, etc.)
- storage pluggable: `local` ou `s3`

## Tipos principais

- `checklist-reprova`
- `checklist-assinatura`
- `atividade-turno`
- `apr-evidence`
- `medidor`

Consulte tipos em runtime:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/upload/types
```

## Fluxo técnico

1. Controller valida arquivo (mimetype/limite).
2. `UploadService` normaliza metadados e gera fingerprint (SHA-256).
3. Handler pode retornar arquivo já existente (`findExisting`) para idempotência.
4. Se novo, arquivo é enviado ao storage.
5. Handler persiste vínculos de negócio.
6. Em erro de persistência, arquivo recém-enviado é removido.

## Deduplicação (implementação atual)

Para evitar salvar a mesma foto várias vezes em retry:

- fingerprint por `checksum` SHA-256 no `UploadService`
- chave idempotente em `UploadEvidence.idempotencyKey`
- checksum também em `ChecklistRespostaFoto.checksum`
- unique em `(checklistRespostaId, checksum)`

Isso cobre principalmente:

- reprova de checklist
- assinatura de checklist

## Storage local

Variáveis:

- `UPLOAD_STORAGE=local`
- `UPLOAD_ROOT=/caminho/absoluto/ou_relativo`
- `UPLOAD_BASE_URL` (opcional)

Com local:

- arquivo físico salvo em `UPLOAD_ROOT/<path>`
- API expõe estáticos em `/uploads/*`
- URL retornada:
  - relativa: `/uploads/...` (quando `UPLOAD_BASE_URL` vazio)
  - absoluta: `<UPLOAD_BASE_URL>/...` (quando definido)

## Storage S3

Variáveis:

- `UPLOAD_STORAGE=s3`
- `AWS_S3_BUCKET`
- `AWS_REGION`
- opcionais: `AWS_S3_ENDPOINT`, `AWS_S3_PUBLIC_URL`, credenciais

## Como o web acessa as fotos

### Opção A: proxy via Next (mais simples)

- `apps/web/next.config.ts` faz rewrite de `/uploads/*`
- configurar `UPLOAD_PROXY_TARGET` (ou `NEXT_PUBLIC_API_URL`)

Exemplo:

```env
UPLOAD_PROXY_TARGET=https://api.seu-dominio.com
```

### Opção B: URL pública direta (CDN/Nginx/S3)

Use uma base pública no frontend:

```env
NEXT_PUBLIC_PHOTOS_BASE_URL=https://storage.seu-dominio.com
```

A função `buildPhotoUrl` em `apps/web/src/lib/utils/photos.ts` concatena base + path.

## Produção com Nginx servindo só uploads

Quando quiser servir apenas a pasta de upload sem passar pela API:

```nginx
location /uploads/ {
  alias /var/www/nexa-oper/uploads/;
  add_header Cache-Control "public, max-age=31536000";
}
```

Nesse cenário, alinhe:

- `UPLOAD_ROOT=/var/www/nexa-oper/uploads`
- `UPLOAD_BASE_URL=https://seu-dominio.com/uploads` (ou domínio de storage)

## Troubleshooting rápido

- foto não encontrada: conferir `UPLOAD_ROOT` e arquivo físico
- URL quebrada: conferir `UPLOAD_BASE_URL` e/ou `NEXT_PUBLIC_PHOTOS_BASE_URL`
- duplicidade: validar migration de checksum/idempotency aplicada
