# Envelope de Resposta da API

O projeto utiliza um **Interceptor Global** (`ResponseEnvelopeInterceptor`) para padronizar 100% das respostas bem-sucedidas da API. Isso garante que todo cliente consuma os dados de forma previsível.

## Estrutura Padrão

Toda resposta JSON segue o formato `ApiEnvelope<T>`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso", // Opcional
  "meta": {                                  // Opcional
    "page": 1,
    "limit": 10
  }
}
```

- **success**: Sempre `true` para respostas tratadas pelo interceptor (códigos 2xx).
- **data**: O conteúdo principal retornado pelo Controller.
- **message**: (Opcional) Mensagem informativa para o cliente.
- **meta**: (Opcional) Metadados extras, como paginação, tokens, etc.

---

## Como Usar nos Controllers

### 1. Retorno Simples (Padrão)

Basta retornar os dados normalmente. O interceptor varre o retorno e o coloca dentro de `data`.

```typescript
@Get()
findAll() {
  // Retorna: [{ id: 1, nome: 'Teste' }]
  return this.usersService.findAll();
}
```

**Saída na API:**

```json
{
  "success": true,
  "data": [{ "id": 1, "nome": "Teste" }]
}
```

### 2. Retorno com Metadados ou Mensagem

Utilize o helper `envelopeData` quando precisar enviar informações adicionais além do dado principal.

```typescript
import { envelopeData } from 'src/core/http/interceptors/envelope.types';

@Get()
findAll() {
  const users = ...;
  return envelopeData(users, {
    message: 'Usuários listados',
    meta: { total: 100, page: 1 }
  });
}
```

**Saída na API:**

```json
{
  "success": true,
  "data": [...],
  "message": "Usuários listados",
  "meta": {
    "total": 100,
    "page": 1
  }
}
```

---

## Comportamentos Especiais

### Retorno `undefined` ou `null`

Se o controller retornar `undefined` ou `null` (ex: em um método `void`), o interceptor **não altera** a resposta. Isso geralmente resulta em um status `204 No Content` sem corpo, o que é o comportamento esperado.

### Bypass (Ignorar o Envelope)

Se você injetar o objeto de resposta do Express (`@Res() res`) e responder manualmente (ex: `res.json(...)` ou `res.send(...)`), o NestJS ignora os interceptors por padrão, e o envelope **não será aplicado**.

Se precisar usar `@Res()` mas ainda quiser o padrão, use o helper `envelope()` manualmente:

```typescript
import { envelope } from 'src/core/http/interceptors/envelope.types';

@Get('pdf')
download(@Res() res: Response) {
  // ... lógica manual
  res.json(envelope(dados));
}
```
