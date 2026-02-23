# Deploy em Produção com PM2

Este guia usa o `ecosystem.config.js` da raiz como base.

## Pré-checklist

- acesso SSH ao servidor
- backup do banco executado
- variáveis de ambiente de produção preparadas
- DNS/proxy reverso configurado

## Estrutura esperada no servidor

```text
/var/www/nexa-oper/
├── apps/
├── packages/
├── logs/
└── ecosystem.config.js
```

O `ecosystem.config.js` atual está parametrizado com caminhos absolutos em `/var/www/nexa-oper`.

## Passo a passo

1. Atualizar código.

```bash
cd /var/www/nexa-oper
git fetch --all
git checkout main
git pull --ff-only
```

2. Instalar dependências.

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

O `ecosystem.config.js` atual lê:

- API: `/var/www/nexa-oper/apps/api/.env`
- Web: `/var/www/nexa-oper/apps/web/.env.local`

Garanta que esses arquivos existam com valores de produção.

## Uploads em produção

Se usar storage local:

- `UPLOAD_STORAGE=local`
- `UPLOAD_ROOT=/var/www/nexa-oper/uploads` (ou volume dedicado)

Exposição de fotos:

1. Via API (`/uploads/*`) e proxy para API.
2. Via Nginx direto em `/uploads/*` com `alias` para `UPLOAD_ROOT`.

Exemplo Nginx:

```nginx
location /uploads/ {
  alias /var/www/nexa-oper/uploads/;
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
