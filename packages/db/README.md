# @nexa-oper/db

Pacote Prisma compartilhado do monorepo.

## Responsabilidade

- centralizar schema de banco
- versionar migrations
- gerar Prisma Client único consumido por API e Web

## Estrutura

```text
packages/db/
├── prisma/models/
│   ├── schema.prisma
│   ├── *.prisma
│   └── migrations/
├── prisma/generated/prisma/
└── scripts/with-env.mjs
```

## Comandos

```bash
npm run db:generate --workspace=packages/db
npm run migrate:dev --workspace=packages/db
npm run migrate:deploy --workspace=packages/db
npm run studio --workspace=packages/db
```

## Fluxo recomendado

1. alterar modelo em `prisma/models/*.prisma`
2. rodar migration de dev
3. validar aplicação local
4. promover migration para produção com `migrate:deploy`

## Ambiente

Scripts Prisma carregam env na cadeia:

1. `packages/db/.env.local`
2. `packages/db/.env`
3. `.env.local` (raiz)
4. `.env` (raiz)

## Referências

- configuração de env: `docs/02-configuracao-env.md`
- build/release: `docs/06-build-release.md`
