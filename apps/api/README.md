# Nexa API

API backend em NestJS para operação mobile de turnos, sincronização de cadastros, upload de evidências e controle de permissões por contrato.

## Stack

- NestJS 11
- Prisma + MariaDB (`@prisma/adapter-mariadb`)
- JWT (auth mobile)
- Jest (unit + e2e)

## Documentação

- Visão geral: `docs/index.md`
- Setup: `docs/setup.md`
- Arquitetura: `docs/architecture.md`
- Contratos externos: `src/contracts/README.md`

## Módulos de domínio

- Auth: `src/modules/auth/README.md`
- Turno: `src/modules/turno/README.md`
- Sync: `src/modules/sync/README.md`
- Upload: `src/modules/upload/README.md`
- Localização: `src/modules/localizacao/README.md`

## Execução

```bash
npm install
npm run start:dev
```

## Build e qualidade

```bash
npm run lint
npm run build
npm test -- --runInBand --watchman=false --passWithNoTests
npm run test:e2e -- --watchman=false
```

## Variáveis obrigatórias

- `DATABASE_URL`
- `JWT_SECRET` (mínimo 32 caracteres)

Referência completa: `src/core/config/README.md`.

## Arquitetura (resumo)

- Casos de uso em `application/use-cases`
- Portas (interfaces) em `domain/ports`
- Adaptadores concretos (Prisma/storage) em `services`
- Contratos HTTP estáveis em `src/contracts`

## Licença

UNLICENSED
