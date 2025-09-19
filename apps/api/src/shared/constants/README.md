# Constantes Compartilhadas

Este diretório contém constantes que são utilizadas por múltiplos módulos da aplicação, promovendo
reutilização de código e facilitando a manutenção.

## Estrutura

### `shared.constants.ts`

Contém as constantes comuns a todos os módulos:

- **PAGINATION_CONFIG**: Configurações de paginação (limites, página padrão)
- **AUDIT_CONFIG**: Configurações de auditoria (usuário padrão do sistema)
- **CACHE_CONFIG**: Configurações de cache (TTL padrões)
- **VALIDATION_CONFIG**: Validações comuns (tamanho máximo de busca)
- **ORDER_CONFIG**: Ordenações padrão (DEFAULT_ORDER, SYNC_ORDER)
- **COMMON_ERROR_MESSAGES**: Mensagens de erro comuns

## Como Usar

### Importando Constantes Compartilhadas

```typescript
import {
  PAGINATION_CONFIG,
  AUDIT_CONFIG,
  CACHE_CONFIG,
  ORDER_CONFIG,
  COMMON_ERROR_MESSAGES,
} from '../../../shared/constants';
```

### Constantes Específicas do Módulo

Cada módulo mantém suas constantes específicas com prefixo:

- APR: `APR_VALIDATION_CONFIG`, `APR_ORDER_CONFIG`
- Checklist: `CHECKLIST_VALIDATION_CONFIG`, `CHECKLIST_ORDER_CONFIG`
- Veículo: `VEICULO_VALIDATION_CONFIG`

### Compatibilidade

Os módulos re-exportam as constantes compartilhadas para manter compatibilidade com código
existente:

```typescript
// Re-export das constantes compartilhadas para manter compatibilidade
export { AUDIT_CONFIG, CACHE_CONFIG } from '../../../shared/constants';
```

## Benefícios

1. **DRY (Don't Repeat Yourself)**: Elimina duplicação de código
2. **Manutenção Centralizada**: Mudanças em constantes comuns afetam todos os módulos
3. **Consistência**: Garante que todos os módulos usem os mesmos valores padrão
4. **Compatibilidade**: Mantém a API existente dos módulos

## Adicionando Novas Constantes

### Para Constantes Comuns

1. Adicione no `shared.constants.ts`
2. Documente o propósito da constante
3. Considere se realmente é comum a todos os módulos

### Para Constantes Específicas

1. Adicione no arquivo de constantes do módulo específico
2. Use prefixo do módulo (ex: `APR_`, `CHECKLIST_`, `VEICULO_`)
3. Re-export se necessário para compatibilidade
