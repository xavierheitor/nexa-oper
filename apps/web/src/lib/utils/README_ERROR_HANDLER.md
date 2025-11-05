# Error Handler - Configuração de Logs para API

## Variável de Ambiente

Para habilitar o envio de logs de erro do client-side para a API, configure a seguinte variável de ambiente:

```env
NEXT_PUBLIC_API_LOG_URL=http://localhost:3001
```

**Importante:**
- A variável deve começar com `NEXT_PUBLIC_` para estar disponível no client-side
- Use a URL base da API (sem `/api` no final)
- Se a variável não estiver configurada, os logs serão apenas salvos localmente (console)

## Como Funciona

1. Quando um erro é capturado pelo `errorHandler`, ele:
   - Loga localmente no console (sempre)
   - Envia para a API se `NEXT_PUBLIC_API_LOG_URL` estiver configurada (opcional)

2. O envio é **assíncrono e não bloqueante**:
   - Usa `fetch` com `keepalive: true`
   - Não aguarda resposta da API
   - Erros de rede são ignorados silenciosamente
   - Não afeta a experiência do usuário

3. Na API, os logs são salvos em:
   - Arquivo: `logs/web-error.log` (configurável via `LOG_PATH`)
   - Também logado no console da API

## Exemplo de Configuração

### Desenvolvimento Local

```env
NEXT_PUBLIC_API_LOG_URL=http://localhost:3001
```

### Produção

```env
NEXT_PUBLIC_API_LOG_URL=https://api.seudominio.com
```

## Endpoint da API

- **URL:** `POST /api/web-logs/error`
- **Body:**
  ```json
  {
    "message": "[ErrorHandler] ComponenteNome - Erro ao processar",
    "context": "ComponenteNome",
    "actionType": "create",
    "metadata": {
      "error": "Error message",
      "errorName": "TypeError",
      "errorStack": "..."
    }
  }
  ```

## Segurança

- O endpoint não requer autenticação (logs públicos)
- Logs são sanitizados automaticamente (sem dados sensíveis)
- Falhas no envio não afetam a aplicação

