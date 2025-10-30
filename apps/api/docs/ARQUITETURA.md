# Visão e Arquitetura da API

## Tecnologias

- NestJS, TypeScript, Swagger
- Prisma via pacote compartilhado `@nexa-oper/db`

## Estrutura de Pastas (API)

```bash
apps/api/src/
├── main.ts                 # Bootstrap, CORS, pipes, filtros globais, Swagger
├── app.module.ts           # Módulo raiz e configuração de middlewares/interceptors globais
├── common/                 # Infra cross-cutting (decorators, filtros, interceptors, middleware, utils)
├── config/                 # Validação de env
├── database/               # Módulo de DB (injeção de Prisma)
├── health/                 # Healthcheck
├── metrics/                # Métricas e observabilidade
└── modules/                # Domínios de negócio (apr, checklist, turno, etc.)
```

## Inicialização e Configuração Global

- `main.ts` configura:
  - CORS, body parser (limite 50MB), timeout, validação global (ValidationPipe)
  - Filtro global de exceções (`AllExceptionsFilter`)
  - Swagger (não produção) em `/api/docs`
  - Prefixo global `api`, shutdown hooks e graceful shutdown

Código de referência:

```1:46:apps/api/src/main.ts
/**
 * Ponto de Entrada da API NestJS - Nexa Oper
 * ...
 */
```

## Módulo Raiz e Cross-cutting

- `app.module.ts` importa módulos de domínio, registra interceptors globais e aplica middlewares.
- Middlewares globais: `LoggerMiddleware` (todas as rotas) e `RateLimitMiddleware` (rota de login).
- Interceptors globais: `ErrorLoggingInterceptor`, `OperationLoggingInterceptor`.

Código de referência:

```69:172:apps/api/src/app.module.ts
/**
 * Módulo raiz da aplicação
 * ...
 */
```

## Padrões

- Validações via `class-validator` + `ValidationPipe`
- DTOs documentados no Swagger com `@ApiProperty`
- Tratamento padronizado de erros e logs estruturados
- Arquitetura modular por domínio
