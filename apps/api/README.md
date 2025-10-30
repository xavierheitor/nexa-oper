# API - Nexa Oper

API backend da aplicação Nexa Oper, construída com NestJS.

## Visão
- Arquitetura modular por domínio (`src/modules/*`)
- Cross-cutting centralizado em `src/common` (decorators, filtros, interceptors, middleware, utils)
- Configuração global em `main.ts` (CORS, validação, filtros, Swagger em dev) e `app.module.ts` (imports, middlewares, interceptors globais)
- Acesso a dados via pacote compartilhado `@nexa-oper/db` (Prisma)

## Estrutura
```bash
src/
├── main.ts             # Bootstrap e configuração global
├── app.module.ts       # Módulo raiz (imports, middlewares, interceptors)
├── common/             # Infra transversal (middleware, interceptors, utils)
├── database/           # Módulo de banco de dados
├── health/             # Healthcheck
├── metrics/            # Métricas e observabilidade
└── modules/            # Módulos de negócio (apr, checklist, turno, etc.)
```

## Documentação do Código
Consulte a documentação detalhada em `apps/api/docs/`:
- `ARQUITETURA.md` — visão e organização
- `MIDDLEWARES_INTERCEPTORS.md` — comportamento e pontos de extensão
- `FLUXOS_TURNO.md` — fluxos de abertura/fechamento (web e mobile)
- `PAYLOADS.md` — contratos de entrada/saída por endpoint

## Ambiente
- Validação de variáveis em `src/config/validation.ts` (via `@nestjs/config`)
- Interceptores globais: `ErrorLoggingInterceptor`, `OperationLoggingInterceptor`
- Middlewares: `LoggerMiddleware` (global) e `RateLimitMiddleware` (login)

## Observabilidade
- `StandardLogger` + sanitização (`sanitizeHeaders`, `sanitizeData`)
- Métricas via `metrics` (quando habilitado)
