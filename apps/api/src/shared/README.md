# Shared (Compartilhado)

Módulos, utilitários, DTOs e constantes compartilhados entre múltiplos domínios da aplicação.

## Estrutura Recomendada

- **constants/**: Constantes globais (ex: Regex, Limites).
- **utils/**: Funções puras utilitárias (ex: formatação de data, cálculo de hash).
- **dto/**: DTOs compartilhados (ex: paginação).
- **decorators/**: Decorators genéricos.

> Mantenha este diretório livre de lógica de negócio específica de um domínio. Se algo pertence a um domínio específico, coloque no respectivo módulo em `src/modules`.
