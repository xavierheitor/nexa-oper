# Logger – Manual de uso

Módulo de logging reutilizável: **AppLogger** como logger principal, contexto por request (AsyncLocalStorage) e log automático de requisições HTTP.

---

## Visão geral

| Recurso | O que é | Quando usar |
|--------|---------|-------------|
| **AppLogger** | Logger principal da app (injetável). Dentro de request usa o logger do request (com requestId); fora usa o logger raiz. | Em qualquer service/controller: `constructor(private readonly log: AppLogger) {}`. |
| **RequestContextMiddleware** | Preenche o contexto por request (requestId + child logger) e loga cada resposta (status, tempo, ip). | Registrar no `AppModule` para ter log automático de requisições e `AppLogger` com requestId. |
| **RequestContext** | Acesso ao requestId e ao logger do request (AsyncLocalStorage). | Quando precisar de `requestId` ou logger fora de injeção (ex.: em lib que não recebe o logger). |
| **NestPinoLogger** | Implementa `LoggerService` do Nest. | Para `app.useLogger(app.get(NestPinoLogger))` no `main.ts` (logs internos do Nest). |
| **Pino (pino.ts)** | Config e factory do Pino (opções e transport via env). | Ajustar nível, pretty, arquivos, redact, etc. |

---

## 1. Onde e como configurar

### 1.1 Registrar no `AppModule`

No **`app.module.ts`**:

1. Adicione **AppLogger** e **RequestContextMiddleware** nos imports do módulo.
2. Registre **AppLogger** e **NestPinoLogger** em `providers` e `exports`.
3. Aplique o middleware **RequestContextMiddleware** em todas as rotas (ou nas que quiser).

```ts
// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import {
  AppLogger,
  NestPinoLogger,
  RequestContextMiddleware,
} from './core/logger';

@Module({
  controllers: [AppController],
  providers: [AppService, AppLogger, NestPinoLogger],
  exports: [AppService, AppLogger, NestPinoLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
```

- **RequestContextMiddleware**: cria o contexto por request (requestId + child logger), define header `x-request-id` e, ao final da resposta, loga status, tempo, ip e user-agent.
- **AppLogger**: quando injetado e usado dentro de um request, usa automaticamente o logger desse request (com requestId nos bindings).

### 1.2 (Opcional) Logger global do Nest no `main.ts`

Para que os logs internos do Nest (bootstrap, rotas, etc.) também usem Pino:

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestPinoLogger } from './core/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(NestPinoLogger));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

Isso não substitui o **AppLogger**: use **AppLogger** na sua lógica (services/controllers) e **NestPinoLogger** apenas como logger do framework.

---

## 2. Como usar o AppLogger no resto da app

Injete **AppLogger** onde precisar de log (services, controllers, etc.) e use os métodos abaixo. Dentro de um request HTTP, o logger já terá requestId, method e url nos bindings (graças ao middleware).

### 2.1 Injeção e uso básico

```ts
import { Injectable } from '@nestjs/common';
import { AppLogger } from '../core/logger';

@Injectable()
export class SyncService {
  constructor(private readonly log: AppLogger) {}

  async executar() {
    this.log.operation('Iniciando sync', { module: 'Sync' });
    // ...
    this.log.info('Finalizado', { total: 123 });
  }
}
```

### 2.2 Métodos disponíveis

| Método | Uso | Nível / tag |
|--------|-----|-------------|
| **info(message, data?)** | Log informativo com dados opcionais. | info |
| **warn(message, data?)** | Aviso. | warn |
| **error(message, err?, data?)** | Erro; pode passar `Error` e dados extras. | error |
| **debug(message, data?)** | Detalhe para debug. | debug |
| **operation(message, ctx?, data?)** | Operação de negócio (ex.: sync, job). | info, tag OPERATION |
| **validation(message, ctx?, data?)** | Validação (payload, regras). | debug, tag VALIDATION |
| **database(message, ctx?, data?)** | Acesso a banco (query, tempo). | debug, tag DATABASE |
| **auth(message, ctx?, data?)** | Autenticação/autorização. | debug, tag AUTH |

Exemplos:

```ts
this.log.info('Usuário criado', { userId: 1 });
this.log.warn('Campo opcional ausente', { campo: 'email' });
this.log.error('Falha ao salvar', new Error('timeout'), { id: 123 });
this.log.debug('Cache hit', { key: 'user:1' });

this.log.operation('Iniciando sync', { module: 'Sync' });
this.log.validation('Payload inválido', { errors: [...] });
this.log.database('Query executada', { table: 'users' }, { durationMs: 10 });
this.log.auth('Login bem-sucedido', { userId: 1 });
```

O segundo argumento (ctx) e o terceiro (data) são opcionais e tipados como `Record<string, unknown>`.

---

## 3. Log automático das requisições

Com o **RequestContextMiddleware** aplicado em `forRoutes('*')`:

- Cada request ganha um **requestId** (ou usa `x-correlation-id` / `x-request-id` do cliente) e o header **x-request-id** na resposta.
- Um **child logger** é criado com `requestId`, `method` e `url` nos bindings.
- Esse child é armazenado no **RequestContext** (AsyncLocalStorage) e usado pelo **AppLogger** quando você chama `this.log.*` dentro do request.
- Ao final da resposta (`res.on('finish')`), o middleware loga um evento HTTP com status, tempo de resposta, ip e user-agent (e 5xx como error, 4xx como warn, 2xx/3xx como info).

Não é necessário logar a requisição manualmente; basta manter o middleware registrado.

---

## 4. RequestId e logger fora de injeção

Se precisar do **requestId** ou do logger em código que não recebe **AppLogger** por construtor (ex.: função utilitária chamada no meio do request):

```ts
import { RequestContext } from './core/logger';

const requestId = RequestContext.getRequestId(); // string | undefined
const logger = RequestContext.getLogger();      // pino.Logger | undefined
```

Use dentro do mesmo request em que o middleware rodou; fora disso retorna `undefined`.

---

## 5. Usar req.requestId e req.log (opcional)

O middleware também preenche **req.requestId** e **req.log** (child logger). Para tipar o request:

```ts
import type { RequestWithLog } from '../core/logger';

@Get()
list(@Req() req: RequestWithLog) {
  req.log.info('Listando usuários');
  const id = req.requestId;
  return [];
}
```

Na maior parte dos casos, injetar **AppLogger** e usar `this.log` é suficiente; o **AppLogger** já usa o mesmo logger do request por baixo.

---

## 6. Variáveis de ambiente (pino)

Configuração em **pino.ts** (e opcionalmente via env):

| Variável | Uso | Padrão |
|----------|-----|--------|
| **NODE_ENV** | `production` altera nível e transport. | - |
| **LOG_LEVEL** | Nível global (info, debug, etc.). | info (prod) / debug (dev) |
| **SERVICE_NAME** | Nome do serviço nos logs. | `nexa-api` |
| **LOG_PRETTY** | Usar pino-pretty (legível no terminal). | true em dev, false em prod |
| **LOG_TO_FILE** | Gravar em arquivo (app.log + error.log). | false |
| **LOG_PATH** | Pasta dos arquivos de log. | `./logs` |
| **LOG_APP_FILE** / **LOG_ERROR_FILE** | Caminho dos arquivos. | `{LOG_PATH}/app.log`, `{LOG_PATH}/error.log` |
| **LOG_REDACT_PATHS** | Paths para redact (separados por vírgula). | Lista padrão (auth, password, etc.) |
| **LOG_MESSAGE_KEY** | Chave da mensagem no JSON. | `message` |

Redact: campos sensíveis (headers de auth, body com password, token, etc.) são substituídos por `****` automaticamente.

---

## 7. Resumo rápido

- **Configurar**: no **AppModule**, adicionar **AppLogger** e **NestPinoLogger** em providers/exports e aplicar **RequestContextMiddleware** em `forRoutes('*')`. Opcional: `app.useLogger(app.get(NestPinoLogger))` no **main.ts**.
- **Usar no app**: `constructor(private readonly log: AppLogger) {}` e chamar `this.log.info`, `this.log.operation`, etc. Dentro de um request, o log já sai com requestId.
- **Log automático de requisições**: fica a cargo do **RequestContextMiddleware**; não é preciso logar cada request manualmente.
- **RequestId/logger fora de injeção**: `RequestContext.getRequestId()` e `RequestContext.getLogger()`.
- **Opção alternativa por request**: tipar com **RequestWithLog** e usar **req.log** e **req.requestId**.
