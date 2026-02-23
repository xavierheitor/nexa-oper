# Configuração e Execução

## Pré-requisitos

- Node.js 18+
- npm 9+
- MariaDB (ou compatível)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie `.env` na raiz com os campos mínimos:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nexa"
JWT_SECRET="seu-segredo-com-pelo-menos-32-caracteres"
```

Consulte todas as variáveis em `src/core/config/README.md`.

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Rodando local

```bash
npm run start:dev
```

## Build

```bash
npm run build
npm run start:prod
```

## Testes

```bash
npm run lint
npm run test -- --runInBand --watchman=false --passWithNoTests
npm run test:e2e -- --watchman=false
```
