# Nexa Web

Aplicação web Next.js do monorepo Nexa Oper.

## Execução

```bash
npm run dev --workspace=apps/web
```

## Build

```bash
npm run build --workspace=apps/web
```

## Pontos de entrada importantes

- app router: `apps/web/src/app`
- actions: `apps/web/src/lib/actions`
- services/repositories: `apps/web/src/lib/services`, `apps/web/src/lib/repositories`
- config next: `apps/web/next.config.ts`

## Documentação oficial

- `docs/README.md`
- `docs/01-arquitetura-monorepo.md`
- `docs/02-configuracao-env.md`
- `docs/04-guia-criacao-modulo-web.md`
- `docs/05-upload-fotos-e-arquivos.md`
