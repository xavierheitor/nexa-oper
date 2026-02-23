# Configuração de Ambiente (.env)

## Estratégia do monorepo

O projeto aceita `.env` na raiz e overrides por app/pacote.

## Ordem de carga

### API (`apps/api/src/core/config/load-env.ts`)

1. `apps/api/.env.local`
2. `apps/api/.env`
3. `.env.local` (raiz)
4. `.env` (raiz)

### Web (`apps/web/next.config.ts`)

1. `apps/web/.env.local`
2. `apps/web/.env`
3. `.env.local` (raiz)
4. `.env` (raiz)

### DB (`packages/db/scripts/with-env.mjs`)

1. `packages/db/.env.local`
2. `packages/db/.env`
3. `.env.local` (raiz)
4. `.env` (raiz)

## Arquivo base recomendado

Use `.env.example` como ponto de partida:

```bash
cp .env.example .env
```

## Variáveis essenciais

### Banco

- `DATABASE_URL` (obrigatória)
- `SHADOW_DATABASE_URL` (obrigatória para `prisma migrate dev`)

### API

- `JWT_SECRET` (min 32 chars)
- `PORT` (em dev normalmente `3001`)
- `GLOBAL_PREFIX` (padrão: `api`)

### Web

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (ou `AUTH_SECRET`)
- `NEXT_PUBLIC_API_URL`

### Upload

- `UPLOAD_STORAGE=local|s3`
- `UPLOAD_ROOT` (se local)
- `UPLOAD_BASE_URL` (opcional)
- `UPLOAD_PROXY_TARGET` (web rewrite `/uploads/*`)
- `NEXT_PUBLIC_PHOTOS_BASE_URL` (quando frontend precisa base explícita)

## Perfis por ambiente

### Desenvolvimento

- API em `:3001`
- Web em `:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Produção

- definir `NODE_ENV=production`
- apontar `DATABASE_URL` para banco de produção
- ajustar CORS (`CORS_ORIGINS`) na API
- definir estratégia de fotos (`UPLOAD_BASE_URL` e/ou proxy)

## Regras práticas

- não versionar `.env` real
- versionar apenas `.env.example`
- manter segredos fora de arquivos de documentação
- em deploy, preferir injeção de env por infraestrutura/PM2

## Diagnóstico rápido

```bash
# checar variáveis relevantes de upload
rg -n "UPLOAD_|NEXT_PUBLIC_API_URL|NEXT_PUBLIC_PHOTOS_BASE_URL|UPLOAD_PROXY_TARGET" .env apps/api/.env apps/web/.env apps/web/.env.local

# testar API local
curl -i http://localhost:3001/__ping
```
