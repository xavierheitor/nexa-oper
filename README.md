# Nexa Oper

> Plataforma para apoiar operações de campo, organização de turnos, registros e acompanhamento de atividades. Este repositório público permite avaliar a arquitetura e a implementação de uma aplicação web com API backend.

## Visão rápida para avaliação técnica

| Área | Implementação |
| --- | --- |
| Backend | Node.js, TypeScript, NestJS 11, APIs REST |
| Persistência | Prisma ORM, MySQL/MariaDB, migrations |
| Arquitetura | Módulos de domínio, controllers, DTOs, casos de uso, portas e adaptadores |
| Segurança e contratos | Módulo de autenticação, JWT, validação de entrada, documentação Swagger |
| Qualidade | Jest (unitários/e2e), ESLint, formatação e workflow GitHub Actions |
| Aplicação web | Next.js, React, TypeScript; monorepo com npm workspaces e Turborepo |

### Onde começar pelo código

- **[Módulos de backend](apps/api/src/modules)**: autenticação, turnos, sincronização, projetos, uploads e localização.
- **[Padrões e decisões de arquitetura](docs/01-arquitetura-monorepo.md)**: responsabilidades, limites entre camadas e integração com o banco.
- **[Guia de implementação de um módulo API](docs/03-guia-criacao-modulo-api.md)**: controllers, DTOs, casos de uso, injeção de dependências e erros.
- **[Configuração de testes](apps/api/package.json)** e **[testes e2e](apps/api/test)**.
- **[CI da API](.github/workflows/api-ci.yml)** e **[documentação](docs/README.md)**.

*Observação:* a existência de scripts e testes não equivale à garantia de cobertura completa. Consulte o código, os testes e os workflows para avaliar o escopo implementado.

---

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
- Mobile Dist (APK Releases): `http://localhost:3001/api/public/mobile-app-version/releases`

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
- reconciliação de turnos: `docs/08-reconciliacao-turnos-escala.md`

## Histórico

- changelog: `CHANGELOG.md`
- notas antigas de release: `docs/archive/releases/`
