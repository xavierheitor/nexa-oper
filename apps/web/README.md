# Nexa Web

Frontend Next.js do monorepo Nexa Oper.

## Função no sistema

- operação backoffice
- gestão de cadastros e jornada
- consulta de turnos, checklists e evidências

## Execução

```bash
npm run dev --workspace=apps/web
```

## Build

```bash
npm run build --workspace=apps/web
npm run start --workspace=apps/web
```

## Estrutura principal

- rotas: `apps/web/src/app/*`
- server actions: `apps/web/src/lib/actions/*`
- serviços: `apps/web/src/lib/services/*`
- repositórios: `apps/web/src/lib/repositories/*`
- schemas: `apps/web/src/lib/schemas/*`
- componentes: `apps/web/src/ui/*`

## Variáveis essenciais

- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (ou `AUTH_SECRET`)
- variáveis de fotos/proxy quando aplicável (`NEXT_PUBLIC_PHOTOS_BASE_URL`, `UPLOAD_PROXY_TARGET`)

Referência completa: `docs/02-configuracao-env.md`.

## Fotos e uploads

- consumo de fotos via `buildPhotoUrl` (`apps/web/src/lib/utils/photos.ts`)
- proxy de `/uploads/*` via `apps/web/next.config.ts`
- guia oficial: `docs/05-upload-fotos-e-arquivos.md`

## Documentação oficial

- `docs/README.md`
- `docs/01-arquitetura-monorepo.md`
- `docs/02-configuracao-env.md`
- `docs/04-guia-criacao-modulo-web.md`
- `docs/05-upload-fotos-e-arquivos.md`
