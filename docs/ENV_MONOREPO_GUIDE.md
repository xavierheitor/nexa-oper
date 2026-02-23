# Guia de Organização de `.env` no Monorepo

## Objetivo

Reduzir `.env` espalhados e manter uma configuração previsível para `apps/api`, `apps/web` e `packages/db`.

## Estratégia recomendada

1. Use **um arquivo principal** na raiz do monorepo: `/.env`.
2. Use arquivos por app **apenas para override local**:
   - `/apps/api/.env` e `/apps/api/.env.local` (opcional)
   - `/apps/web/.env` e `/apps/web/.env.local` (opcional)
3. Mantenha o template atualizado em `/.env.example`.

## Ordem de precedência (API e Web)

Maior prioridade para menor prioridade:

1. variáveis já definidas no ambiente do processo (shell/CI)
2. `.env.local` da app
3. `.env` da app
4. `.env.local` da raiz
5. `.env` da raiz

Isso permite centralizar no root e sobrescrever só quando necessário.

## Uploads unificados

Use:

```env
UPLOAD_ROOT=./uploads
```

- Caminho relativo é resolvido a partir da **raiz do monorepo**.
- API e Web passam a usar a mesma pasta física por padrão.

Para acesso web:

- Se `UPLOAD_BASE_URL` estiver definido, URLs retornadas serão absolutas.
- Se não estiver, use URLs relativas `/uploads/...` e o Next fará proxy para a API (via `UPLOAD_PROXY_TARGET` ou `NEXT_PUBLIC_API_URL`).

## Variáveis-chave mínimas

- `DATABASE_URL`
- `JWT_SECRET` (API)
- `NEXTAUTH_SECRET` e `NEXTAUTH_URL` (Web)
- `NEXT_PUBLIC_API_URL` (Web)
- `UPLOAD_ROOT` (API + Web, recomendado)
