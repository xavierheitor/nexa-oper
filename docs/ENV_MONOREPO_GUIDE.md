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

## Produção com servidor de arquivos dedicado

Quando você quiser servir fotos por um domínio separado (ex.: `storage.seudominio.com`):

1. API (`/.env`)

```env
UPLOAD_STORAGE=local
UPLOAD_ROOT=/var/www/nexa-oper/uploads
UPLOAD_BASE_URL=https://storage.seudominio.com/uploads
```

2. Web (`/.env`)

```env
NEXT_PUBLIC_PHOTOS_BASE_URL=https://storage.seudominio.com
# Opcional compatibilidade:
NEXT_PUBLIC_UPLOAD_BASE_URL=https://storage.seudominio.com/uploads
```

3. Servidor de arquivos (Nginx exemplo)

```nginx
server {
  listen 443 ssl;
  server_name storage.seudominio.com;

  location /uploads/ {
    alias /var/www/nexa-oper/uploads/;
    autoindex off;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }
}
```

Com esse modelo:

- A API salva no filesystem em `UPLOAD_ROOT`.
- A API grava no banco URLs públicas já absolutas (`UPLOAD_BASE_URL/...`).
- O Web renderiza as fotos usando `urlPublica` quando existir e faz fallback seguro para caminhos antigos.

## Variáveis-chave mínimas

- `DATABASE_URL`
- `JWT_SECRET` (API)
- `NEXTAUTH_SECRET` e `NEXTAUTH_URL` (Web)
- `NEXT_PUBLIC_API_URL` (Web)
- `UPLOAD_ROOT` (API + Web, recomendado)
