# @nexa-oper/db

Pacote Prisma compartilhado do monorepo.

## Responsabilidade

- manter schema e migrations
- gerar Prisma Client consumido por `apps/api` e `apps/web`

## Comandos principais

```bash
npm run db:generate --workspace=packages/db
npm run migrate:dev --workspace=packages/db
npm run migrate:deploy --workspace=packages/db
```

## Estrutura

```text
packages/db/
├── prisma/models/
│   ├── schema.prisma
│   ├── *.prisma
│   └── migrations/
└── prisma/generated/prisma/
```

## Observações

- scripts carregam env via `packages/db/scripts/with-env.mjs`
- em produção, usar `migrate:deploy`

## Documentação oficial

- `docs/README.md`
- `docs/02-configuracao-env.md`
- `docs/06-build-release.md`
