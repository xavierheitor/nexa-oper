# Errors – Manual de uso

Módulo de **tratamento de erros** da API: erro padronizado (**AppError**), códigos e mensagens centralizadas, e **GlobalExceptionFilter** que converte qualquer exceção em resposta JSON única.

---

## Visão geral

| Recurso | O que é | Quando usar |
|--------|---------|-------------|
| **AppError** | Classe de erro da aplicação com `code`, `status`, `message` e `details`. Métodos estáticos para cada tipo (validation, notFound, conflict, etc.). | Em services/controllers: `throw AppError.notFound(Messages.vehicleNotFound)` em vez de `HttpException`. |
| **ErrorCode** | Constante e tipo dos códigos de erro (VALIDATION, NOT_FOUND, CONFLICT, UNAUTHORIZED, FORBIDDEN, INTERNAL). | Tipar ou comparar códigos; garantir consistência com o filter. |
| **Messages** | Objeto com mensagens de erro reutilizáveis (e tipo `Messages`). | Evitar strings soltas: `throw AppError.notFound(Messages.vehicleNotFound)`. |
| **GlobalExceptionFilter** | Filtro global que captura todas as exceções e devolve JSON padronizado (statusCode, code, message, details, timestamp, path, requestId). | Registrar no `main.ts` com `useGlobalFilters` para ter uma única forma de erro em toda a API. |

---

## Arquitetura

### Formato da resposta de erro

Toda exceção não tratada vira um JSON com o mesmo formato:

```json
{
  "statusCode": 400,
  "code": "VALIDATION",
  "message": "Dados inválidos fornecidos",
  "details": ["campo X é obrigatório"],
  "timestamp": "2025-02-04T12:00:00.000Z",
  "path": "/api/vehicles",
  "requestId": "abc-123"
}
```

- **statusCode**: HTTP status (400, 401, 404, 409, 500, etc.).
- **code**: Código lógico da API (VALIDATION, NOT_FOUND, CONFLICT, UNAUTHORIZED, FORBIDDEN, INTERNAL).
- **message**: Mensagem para o cliente.
- **details**: Opcional; lista de mensagens (ex.: erros de validação por campo).
- **timestamp**, **path**, **requestId**: Metadados da requisição.

### Fluxo do GlobalExceptionFilter

1. **AppError** – Usado diretamente: `status`, `code`, `message`, `details` viram o body.
2. **HttpException** (Nest) – Ex.: ValidationPipe, `BadRequestException`. O filter extrai status e message (ou array de messages em `details`) e mapeia status → code.
3. **Qualquer outra exceção** – Resposta 500, code `INTERNAL`, message genérica (não expõe detalhes internos).

Log: 4xx → `warn`; 5xx → `error` (incluindo o objeto de erro para diagnóstico).

### Dependências

- **AppLogger**: injetado no filter para logar falhas.
- **Messages**: usado no filter para mensagens padrão (ex.: payload inválido, erro interno).

---

## 1. Onde e como configurar

### 1.1 Registrar o GlobalExceptionFilter no `main.ts`

O filter precisa de **AppLogger**; registre-o após criar a app e antes de `listen`:

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './core/logger/app-logger';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // ... useLogger, configureApp, etc.
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(AppLogger)));
  await app.listen(env.PORT ?? 3000);
}
void bootstrap();
```

Assim, qualquer exceção lançada em controller/service/pipe é capturada e transformada no JSON padronizado.

---

## 2. Como usar

### 2.1 Lançar AppError (recomendado)

Use os métodos estáticos de **AppError** e as mensagens de **Messages**:

```ts
import { AppError } from './core/errors/app-error';
import { Messages } from './core/errors/messages';

// Recurso não encontrado
throw AppError.notFound(Messages.vehicleNotFound);

// Conflito (ex.: duplicidade)
throw AppError.conflict(Messages.plateDuplicate);

// Validação com detalhes (ex.: erros por campo)
throw AppError.validation(Messages.invalidPayload, [
  'placa deve ter formato XXX-9999',
  'ano é obrigatório',
]);

// Sem permissão
throw AppError.forbidden(Messages.forbiddenContract);

// Não autenticado
throw AppError.unauthorized(Messages.unauthorized);

// Erro interno (ou use mensagem customizada)
throw AppError.internal();
throw AppError.internal('Falha ao conectar no serviço X');
```

O **GlobalExceptionFilter** reconhece `AppError` e monta o body com `code`, `status`, `message` e `details` exatamente como definidos.

### 2.2 Usar Messages e ErrorCode

- **Messages**: centralize mensagens para não repetir strings e para i18n futura.

```ts
import { Messages } from './core/errors/messages';

if (!vehicle) throw AppError.notFound(Messages.vehicleNotFound);
```

- **ErrorCode**: use quando precisar checar o tipo de erro (ex.: em testes ou em cliente que consome a API).

```ts
import { ErrorCode } from './core/errors/error-codes';

if (err instanceof AppError && err.code === ErrorCode.NOT_FOUND) {
  // ...
}
```

### 2.3 ValidationPipe e HttpException

O **ValidationPipe** (configurado em `configure-app.ts`) lança **HttpException** quando a validação falha. O **GlobalExceptionFilter** trata essas exceções e devolve o mesmo formato (statusCode, code `VALIDATION`, message, details com as mensagens por campo). Não é necessário lançar **AppError** manualmente nos DTOs; basta usar o pipe global.

Para outros casos em que você lance `BadRequestException`, `NotFoundException`, etc., o filter também normaliza para o mesmo formato de resposta.

---

## 3. Códigos e status HTTP

| ErrorCode    | Status HTTP | Uso típico                          |
|-------------|-------------|-------------------------------------|
| VALIDATION  | 400         | Dados inválidos, validação de DTO   |
| UNAUTHORIZED| 401         | Token inválido ou ausente           |
| FORBIDDEN   | 403         | Sem permissão para o recurso        |
| NOT_FOUND   | 404         | Recurso não encontrado              |
| CONFLICT    | 409         | Conflito (ex.: duplicidade)         |
| INTERNAL    | 500         | Erro inesperado do servidor         |

O **GlobalExceptionFilter** mapeia status → code em **HttpException** (ex.: 404 → NOT_FOUND); para **AppError** o code já vem da classe.

---

## 4. Boas práticas

- **Prefira AppError** em vez de `HttpException` na lógica de negócio; a resposta continua padronizada e o code fica explícito.
- **Use Messages** para todas as mensagens de erro exibidas ao cliente; facilita manutenção e i18n.
- **details** em validação: use array de strings (uma por campo ou regra) para o cliente exibir junto aos campos.
- **Erros 500**: o filter não expõe stack nem mensagem interna; use **AppLogger** para logar o erro completo.
- **Novos códigos**: adicione em **ErrorCode** e, se precisar, em **mapStatusToCode** no filter; mantenha **AppError** e filter alinhados.

---

## 5. Referência rápida

```ts
// Lançar erros
throw AppError.notFound(Messages.vehicleNotFound);
throw AppError.validation(Messages.invalidPayload, ['campo X obrigatório']);
throw AppError.conflict(Messages.plateDuplicate);
throw AppError.forbidden(Messages.forbiddenContract);
throw AppError.unauthorized(Messages.unauthorized);
throw AppError.internal();

// Checar tipo (ex.: em catch ou teste)
if (err instanceof AppError && err.code === ErrorCode.NOT_FOUND) { ... }

// Arquivos do módulo
// app-error.ts     – Classe AppError e métodos estáticos
// error-codes.ts  – ErrorCode (const + tipo)
// messages.ts     – Messages (const + tipo)
// global-exception.filter.ts – Filtro global (registrar no main.ts)
```
