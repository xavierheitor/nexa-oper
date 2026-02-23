# Arquitetura do Monorepo

## Visão geral

O repositório usa `npm workspaces` e `turbo` para organizar aplicações e pacotes compartilhados.

- `apps/web`: UI e server actions (Next.js)
- `apps/api`: APIs REST mobile/backoffice (NestJS)
- `packages/db`: schema, migrations e client Prisma

## Topologia

```text
Cliente Web (Next.js)
  ├─ Server Actions -> Prisma (@nexa-oper/db)
  └─ Requisições HTTP -> API Nest (/api/*)

App Mobile
  └─ Requisições HTTP -> API Nest (/api/*)

API Nest
  ├─ módulos de domínio
  ├─ core (config, logger, erros, segurança)
  └─ PrismaService -> MySQL/MariaDB
```

## Organização por camadas

### API (`apps/api/src`)

- `modules/*`: domínio e casos de uso
- `core/*`: cross-cutting (config, auth base, logger, erros)
- `contracts/*`: contratos públicos estáveis
- `database/*`: integração Prisma

Padrão predominante na API:

- `application/use-cases`: regra de orquestração
- `domain/ports`: portas (interfaces + tokens DI)
- `*.service.ts`: adaptador concreto (Prisma, storage etc.)
- `*.controller.ts`: entrada HTTP
- `dto/*`: validação/shape de entrada

### Web (`apps/web/src`)

- `app/*`: rotas App Router e páginas
- `lib/actions/*`: server actions
- `lib/services/*`: regra de negócio da web
- `lib/repositories/*`: acesso Prisma
- `lib/schemas/*`: validação Zod
- `ui/*`: componentes de interface

Padrão predominante na Web:

- `Schema -> Action -> Service -> Repository -> Prisma`

### Banco (`packages/db`)

- `prisma/models/*.prisma`: modelos segmentados
- `prisma/models/migrations/*`: migrations versionadas
- `prisma/generated/prisma`: client gerado
- scripts `with-env.mjs`: carrega env para comandos Prisma

## Uploads e arquivos

O upload de evidências pertence à API (`apps/api/src/modules/upload`), com:

- handlers por tipo (`checklist-reprova`, `checklist-assinatura`, etc.)
- adapter de storage (`local`/`s3`)
- rota pública de estáticos em `/uploads/*` para storage local

A Web consome as fotos via:

- URL absoluta retornada pela API
- ou caminho relativo `/uploads/*` (proxy/rewrite no Next)

## Decisões arquiteturais importantes

- contratos públicos desacoplados de implementação interna
- validação de env em runtime com Zod (API)
- schema Prisma multi-arquivo dentro de `packages/db/prisma/models`
- padrão idempotente para uploads críticos (assinatura/checksum)

## Limites e responsabilidades

- regra de negócio principal de mobile fica na API
- web usa Prisma diretamente para cenários internos de backoffice
- upload físico e metadados de evidência são responsabilidade da API
