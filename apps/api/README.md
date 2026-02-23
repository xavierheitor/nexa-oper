# Nexa API

Backend NestJS do monorepo Nexa Oper.

## Função no sistema

- autenticação mobile
- abertura/fechamento/sincronização de turnos
- upload de evidências (fotos/arquivos)
- endpoints de suporte ao backoffice

## Execução

```bash
npm run start:dev --workspace=apps/api
```

## Build

```bash
npm run build --workspace=apps/api
npm run start:prod --workspace=apps/api
```

## Entrada e estrutura

- bootstrap: `apps/api/src/main.ts`
- módulo raiz: `apps/api/src/app.module.ts`
- configuração HTTP/env: `apps/api/src/core/config/*`
- domínio: `apps/api/src/modules/*`
- contratos públicos: `apps/api/src/contracts/*`

## Variáveis essenciais

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (normalmente `3001`)
- variáveis de upload quando aplicável (`UPLOAD_*`)

Referência completa: `docs/02-configuracao-env.md`.

## Módulos-chave

- `apps/api/src/modules/turno`
- `apps/api/src/modules/sync`
- `apps/api/src/modules/upload`
- `apps/api/src/modules/localizacao`
- `apps/api/src/modules/atividade-upload`

## Documentação oficial

- `docs/README.md`
- `docs/01-arquitetura-monorepo.md`
- `docs/02-configuracao-env.md`
- `docs/03-guia-criacao-modulo-api.md`
- `docs/05-upload-fotos-e-arquivos.md`
