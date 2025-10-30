# Middlewares e Interceptors

## Middlewares

### LoggerMiddleware (global)

- Logging estruturado de requisição e resposta
- Mede tempo de execução e registra status

Referência:

```51:140:apps/api/src/common/middleware/logger.middleware.ts
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  ...
}
```

### RateLimitMiddleware (auth/login)

- Limita tentativas por IP e por usuário (matrícula)
- Configurável via ENV (`RATE_LIMIT_*`)

Referência:

```1:46:apps/api/src/common/middleware/rate-limit.middleware.ts
import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
```

## Interceptors

### ErrorLoggingInterceptor (global)

- Captura e loga erros com contexto estruturado

Referência:

```1:33:apps/api/src/common/interceptors/error-logging.interceptor.ts
/**
 * Interceptor para Logging Estruturado de Erros
 */
```

### OperationLoggingInterceptor (global)

- Aplica logging automático a métodos anotados com `@LogOperation`
- Log de entrada, saída e tempo

Referência:

```32:66:apps/api/src/common/interceptors/operation-logging.interceptor.ts
@Injectable()
export class OperationLoggingInterceptor implements NestInterceptor {
  ...
}
```

### ValidationErrorInterceptor (móvel)

- Padroniza erros de validação para o formato esperado pelo aplicativo móvel

Referência:

```1:22:apps/api/src/common/interceptors/validation-error.interceptor.ts
/**
 * Interceptor para padronização de erros de validação
 */
```
