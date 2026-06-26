# Deploy em Produção com PM2

Este guia usa o `ecosystem.config.js` da raiz como base.

## Pré-checklist

- acesso SSH ao servidor
- backup do banco executado
- variáveis de ambiente de produção preparadas
- DNS/proxy reverso configurado

## Estrutura esperada no servidor

```text
/var/www/apps/nexa-oper/
├── apps/
│   ├── api/.env
│   └── web/.env.local
├── packages/
├── uploads/
├── logs/
└── ecosystem.config.js
```

Domínios configurados no `ecosystem.config.js`:

- Web: `https://nexa.xsys.team`
- API: `https://api.nexa.xsys.team`

## Preparar variáveis de ambiente (primeira vez)

No servidor, dentro do repositório:

```bash
npm run deploy:env
```

Isso copia os templates de `deploy/production/` para:

- `apps/api/.env`
- `apps/web/.env.local`
- `packages/db/.env`

Edite os arquivos e preencha:

1. `DATABASE_URL` (MySQL de produção)
2. `JWT_SECRET` na API (`openssl rand -base64 48`)
3. `NEXTAUTH_SECRET` no Web (outro secret, diferente do JWT)

## Passo a passo

1. Atualizar código.

```bash
cd /var/www/apps/nexa-oper
git fetch --all
git checkout main
git pull --ff-only
```

2. Deploy automatizado (recomendado):

```bash
npm run deploy:prod
```

O script valida `.env`, roda `npm ci`, migrations, build e `pm2 reload`.

### Passo a passo manual (alternativa)

```bash
npm ci
```

3. Prisma e migrations.

```bash
npm run db:generate
npm run db:migrate:deploy
```

4. Build.

```bash
npm run build
```

5. Subir/recarregar com PM2.

Primeira vez:

```bash
pm2 start ecosystem.config.js
```

Deploy recorrente:

```bash
pm2 reload ecosystem.config.js
```

6. Persistir configuração do PM2 no boot.

```bash
pm2 save
pm2 startup
```

## Comandos operacionais

```bash
pm2 status
pm2 logs nexa-api --lines 200
pm2 logs nexa-web --lines 200
pm2 restart nexa-api
pm2 restart nexa-web
```

## Variáveis e arquivos de env em produção

O `ecosystem.config.js` lê:

- API: `/var/www/apps/nexa-oper/apps/api/.env`
- Web: `/var/www/apps/nexa-oper/apps/web/.env.local`

Templates versionados em `deploy/production/*.template`.

O PM2 também injeta em runtime: `TRUST_PROXY`, `HAS_HTTPS`, URLs públicas e `LOG_PATH`.

## Uploads em produção

Se usar storage local:

- `UPLOAD_STORAGE=local`
- `UPLOAD_ROOT=/var/www/apps/nexa-oper/uploads`

### Limite de upload (APK e arquivos grandes)

O Nginx bloqueia uploads acima de **1 MB** por padrão (`413 Request Entity Too Large`).
Para publicar APKs pelo painel (**Cadastro → Versões do App**), aumente o limite nos dois `server` blocks (web e API):

```nginx
server {
    listen 443 ssl http2;
    server_name nexa.xsys.team;

    client_max_body_size 250m;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... demais headers proxy ...
    }
}

server {
    listen 443 ssl http2;
    server_name api.nexa.xsys.team;

    client_max_body_size 250m;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:3001;
        # ... demais headers proxy ...
    }
}
```

Aplicar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Exposição de fotos:

1. Via API (`/uploads/*`) e proxy para API.
2. Via Nginx direto em `/uploads/*` com `alias` para `UPLOAD_ROOT`.

Exemplo Nginx:

```nginx
location /uploads/ {
  alias /var/www/apps/nexa-oper/uploads/;
  add_header Cache-Control "public, max-age=31536000";
}
```

## Health checks

```bash
curl -i http://127.0.0.1:3001/__ping
curl -I http://127.0.0.1:3000
```

## Rollback simples

```bash
git checkout <tag-ou-commit-anterior>
npm ci
npm run db:generate
npm run build
pm2 reload ecosystem.config.js
```

Se migration incompatível já foi aplicada, rollback exige plano de banco separado.
