# Configuração e Comportamento em Tempo de Execução

Este documento descreve como a API se comporta em runtime e como as variáveis de ambiente
influenciam o bootstrap e os componentes globais.

## Variáveis de Ambiente (API)

- `PORT` (padrão 3001)
- `NODE_ENV` (`development` | `production`)
- `DATABASE_URL` (obrigatória)
- `JWT_SECRET` (obrigatória, ≥ 32 chars)
- `CORS_ORIGINS` (opcional)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_PER_IP`, `RATE_LIMIT_MAX_PER_USER` (opcionais)

## Bootstrap (`main.ts`)

- Carrega `.env` do diretório da API
- Configura CORS, body parser (até 50MB), timeout de requisições
- Aplica `ValidationPipe` global (transform, whitelist, forbidNonWhitelisted)
- Registra `AllExceptionsFilter`
- Habilita Swagger quando `NODE_ENV !== 'production'` em `/api/docs`
- Define prefixo global `api` e shutdown hooks (graceful shutdown)

Referência:

```1:61:apps/api/src/main.ts
/**
 * Ponto de Entrada da API NestJS - Nexa Oper
 */
```

## Módulo Raiz (`app.module.ts`)

- Importa módulos de domínio e infraestrutura (db, auth, contratos, health, metrics, etc.)
- Aplica `LoggerMiddleware` globalmente
- Aplica `RateLimitMiddleware` em `POST auth/login`
- Registra interceptors globais de erro e operação

Referência:

```81:136:apps/api/src/app.module.ts
@Module({
  imports: [ ... ],
  providers: [ ... ],
})
```

## Health e Métricas

- Health: `GET /api/health`
- Métricas: `metrics` (controlador/serviço dedicados)
