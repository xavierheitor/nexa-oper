# Nexa Oper Monorepo

Monorepo com três pilares:

- `apps/web`: frontend Next.js 15
- `apps/api`: backend NestJS 11
- `packages/db`: schema/migrations Prisma compartilhados

## Stack

- Node.js 20+
- npm workspaces + Turborepo
- Next.js + React + TypeScript
- NestJS + Prisma
- MySQL/MariaDB

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

## Quick Start

1. Instalar dependências:

```bash
npm run install:all
```

2. Configurar ambiente (copie e ajuste):

```bash
cp .env.example .env
```

3. Gerar Prisma Client:

```bash
npm run db:generate
```

4. Subir ambiente de desenvolvimento:

```bash
npm run dev
```

## Comandos úteis

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run db:migrate:dev
npm run db:migrate:deploy
```

## Documentação oficial

Comece em `docs/README.md`.

- Arquitetura: `docs/01-arquitetura-monorepo.md`
- Configuração `.env`: `docs/02-configuracao-env.md`
- Criar módulo API: `docs/03-guia-criacao-modulo-api.md`
- Criar módulo Web: `docs/04-guia-criacao-modulo-web.md`
- Upload e fotos: `docs/05-upload-fotos-e-arquivos.md`
- Build/release: `docs/06-build-release.md`
- Deploy com PM2: `docs/07-deploy-producao-pm2.md`

## Estado desta revisão

Esta é a base consolidada da documentação (iteração 1), com foco em fonte única de verdade para setup, arquitetura, upload e produção.
