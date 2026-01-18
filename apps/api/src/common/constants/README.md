# Constantes Compartilhadas

Este diretório concentra todas as constantes da API: as comuns (`common.constants.ts`, `errors.ts`) e as específicas por domínio (`apr.ts`, `turno.ts`, `veiculo.ts`, etc.). Cada consumidor importa do subpath do seu domínio, por exemplo: `@common/constants/turno`, `@common/constants/apr`.

## Estrutura

### `common.constants.ts`

Constantes comuns a todos os módulos:

- **PAGINATION_CONFIG**: Configurações de paginação (limites, página padrão)
- **AUDIT_CONFIG**: Configurações de auditoria (usuário padrão do sistema)
- **CACHE_CONFIG**: Configurações de cache (TTL padrões)
- **VALIDATION_CONFIG**: Validações comuns (tamanho máximo de busca)
- **ORDER_CONFIG**: Ordenações padrão (DEFAULT_ORDER, SYNC_ORDER)
- **COMMON_ERROR_MESSAGES**: Mensagens de erro comuns

### `errors.ts`

Mensagens de erro compartilhadas (validação, não encontrado, conflito, permissão, operação) e `ERROR_MESSAGES` agregado.

### `index.ts`

Exporta apenas `common.constants`. O `index` **não** re-exporta os arquivos por módulo para evitar colisão de nomes como `ERROR_MESSAGES` e `ORDER_CONFIG`.

### Constantes por domínio

| Arquivo          | Exemplos de exportações                                      |
|------------------|--------------------------------------------------------------|
| `apr.ts`         | `APR_VALIDATION_CONFIG`, `APR_ORDER_CONFIG`, `ERROR_MESSAGES`|
| `turno.ts`       | `TURNO_VALIDATION_CONFIG`, `TURNO_STATUS`, `ORDER_CONFIG`    |
| `veiculo.ts`     | `VEICULO_VALIDATION_CONFIG`, `ORDER_CONFIG`                  |
| `equipe.ts`      | `EQUIPE_VALIDATION_CONFIG`, `ORDER_CONFIG`                   |
| `eletricista.ts` | `ELETRICISTA_VALIDATION_CONFIG`, `ORDER_CONFIG`              |
| `atividade.ts`   | `ATIVIDADE_VALIDATION_CONFIG`, `ORDER_CONFIG`                |
| `checklist.ts`   | `CHECKLIST_VALIDATION_CONFIG`, `CHECKLIST_ORDER_CONFIG`      |
| `tipo-veiculo.ts`| `ORDER_CONFIG`, `PAGINATION_CONFIG`, `SEARCH_CONFIG`         |
| `tipo-equipe.ts` | `ORDER_CONFIG`, `PAGINATION_CONFIG`, `SEARCH_CONFIG`         |
| `mobile-upload.ts`| `SUPPORTED_MOBILE_PHOTO_TYPES`, `MAX_MOBILE_PHOTO_FILE_SIZE` |

## Como usar

### Constantes comuns

```typescript
import { PAGINATION_CONFIG, AUDIT_CONFIG, ORDER_CONFIG } from '@common/constants';
import { ERROR_MESSAGES, VALIDATION_ERRORS } from '@common/constants/errors';
```

### Constantes do domínio

```typescript
import { TURNO_VALIDATION_CONFIG, TURNO_STATUS } from '@common/constants/turno';
import { APR_ORDER_CONFIG, ERROR_MESSAGES } from '@common/constants/apr';
import { SUPPORTED_MOBILE_PHOTO_TYPES } from '@common/constants/mobile-upload';
```

## Benefícios

1. **Ponto único**: Todas as constantes em `common/constants/`
2. **Imports explícitos por domínio**: `@common/constants/<modulo>` evita colisões
3. **Manutenção centralizada**: alterações em um só lugar
4. **Consistência**: valores compartilhados em `common.constants` e `errors`
