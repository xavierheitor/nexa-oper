# Interceptors Compartilhados

Este diretório contém interceptors que são utilizados por múltiplos módulos da aplicação para
funcionalidades comuns.

## SyncAuditRemoverInterceptor

### Propósito

Remove automaticamente campos de auditoria (`createdAt`, `updatedAt`, `deletedAt`, `createdBy`,
`updatedBy`, `deletedBy`) de respostas de endpoints de sincronização.

### Benefícios

- **Redução de Payload**: Remove dados desnecessários para clientes mobile
- **Automático**: Não requer modificação manual em cada endpoint
- **Inteligente**: Aplica apenas em rotas que contêm `/sync` no path
- **Recursivo**: Processa objetos aninhados e arrays

### Como Usar

#### 1. Aplicar no Controller

```typescript
import { UseInterceptors } from '@nestjs/common';
import { SyncAuditRemoverInterceptor } from '../../shared/interceptors';

@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('apr/sync')
export class AprSyncController {
  // ...
}
```

#### 2. Usar o Decorator Personalizado (Opcional)

```typescript
import { SyncEndpoint } from '../../shared/decorators';

@SyncEndpoint('apr-sync')
@Controller('apr/sync')
export class AprSyncController {
  // ...
}
```

### Campos Removidos

- `createdAt` - Data de criação
- `updatedAt` - Data de atualização
- `deletedAt` - Data de exclusão
- `createdBy` - Usuário criador
- `updatedBy` - Usuário que atualizou
- `deletedBy` - Usuário que excluiu

### Funcionamento

1. **Detecção**: Verifica se a URL contém `/sync`
2. **Processamento**: Remove campos de auditoria recursivamente
3. **Preservação**: Mantém estrutura de dados aninhados
4. **Performance**: Aplica apenas quando necessário

### Exemplo de Transformação

#### Antes (com campos de auditoria)

```json
{
  "id": 1,
  "nome": "APR Soldagem",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "user123",
  "updatedAt": "2024-01-20T09:00:00.000Z",
  "updatedBy": "user456",
  "deletedAt": null,
  "deletedBy": null
}
```

#### Depois (campos removidos)

```json
{
  "id": 1,
  "nome": "APR Soldagem"
}
```

### Aplicação Atual

- ✅ **APR Sync Controller** - Todos os endpoints de sincronização APR
- ✅ **Checklist Sync Controller** - Todos os endpoints de sincronização Checklist
- ✅ **Veículo Sync Controller** - Todos os endpoints de sincronização Veículo

### Logs

O interceptor registra quando remove campos de auditoria:

```bash
[SyncAuditRemoverInterceptor] Removendo campos de auditoria de: /api/apr/sync/modelos
```
