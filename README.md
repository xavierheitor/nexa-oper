# Nexa Oper

Monorepo oficial do Nexa Oper.

## Aplicações

- `apps/web`: frontend Next.js 15 (backoffice)
- `apps/api`: backend NestJS 11 (mobile + integrações)
- `packages/db`: Prisma schema, migrations e client compartilhado

## Stack

- Node.js 20+
- npm workspaces + Turborepo
- Next.js + React + TypeScript
- NestJS + Prisma + MySQL/MariaDB

## Estrutura

```text
nexa-oper/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── db/
├── docs/
├── ecosystem.config.js
└── package.json
```

## Setup rápido

```bash
npm run install:all
cp .env.example .env
npm run db:generate
npm run dev
```

Ambiente local padrão:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health API: `http://localhost:3001/__ping`

## Fluxos principais

### Desenvolvimento

```bash
npm run dev
# ou separado
npm run web:dev
npm run api:dev
```

### Banco

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:studio
```

### Qualidade e build

```bash
npm run lint
npm run test
npm run build
```

## Uploads e fotos

- API expõe arquivos locais em `/uploads/*`
- Web pode acessar via rewrite/proxy ou URL pública direta
- guia oficial: `docs/05-upload-fotos-e-arquivos.md`

## Produção

- build/release: `docs/06-build-release.md`
- deploy PM2/ecosystem: `docs/07-deploy-producao-pm2.md`

## Documentação oficial

Comece por `docs/README.md`.

- arquitetura: `docs/01-arquitetura-monorepo.md`
- env/config: `docs/02-configuracao-env.md`
- criar módulo API: `docs/03-guia-criacao-modulo-api.md`
- criar módulo Web: `docs/04-guia-criacao-modulo-web.md`
- upload/fotos: `docs/05-upload-fotos-e-arquivos.md`
- build/release: `docs/06-build-release.md`
- deploy PM2: `docs/07-deploy-producao-pm2.md`

## Histórico

- changelog: `CHANGELOG.md`
- notas antigas de release: `docs/archive/releases/`
