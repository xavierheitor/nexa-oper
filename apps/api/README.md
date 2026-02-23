# Nexa API

API NestJS do monorepo Nexa Oper.

## Execução

```bash
npm run start:dev --workspace=apps/api
```

## Build

```bash
npm run build --workspace=apps/api
```

## Pontos de entrada importantes

- bootstrap: `apps/api/src/main.ts`
- configuração global: `apps/api/src/core/config/configure-app.ts`
- env: `apps/api/src/core/config/env.ts`
- módulos: `apps/api/src/modules/*`

## Documentação oficial

- `docs/README.md`
- `docs/01-arquitetura-monorepo.md`
- `docs/02-configuracao-env.md`
- `docs/03-guia-criacao-modulo-api.md`
- `docs/05-upload-fotos-e-arquivos.md`
