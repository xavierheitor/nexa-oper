# Arquitetura do Sistema

O projeto segue a arquitetura modular padrão do **NestJS**, com separação clara de responsabilidades.

## Estrutura de Pastas

- **`src/modules`**: Contém os módulos de domínio. Estrutura padrão por módulo: `application/use-cases`, `domain/ports`, `controllers`, `services` (adapters), `dto`.
- **`src/core`**: Funcionalidades transversais essenciais, como Middlewares, Interceptors, Filters, Guards e configurações globais.
- **`src/shared`**: Utilitários, constantes e helpers compartilhados entre múltiplos módulos.
- **`src/database`**: Configurações de conexão com o banco e Prisma Service.
- **`src/contracts`**: Contratos externos estáveis de request/response/error expostos pela API.

## Padrões Adotados

### Design Patterns

- **Dependency Injection**: Amplamente utilizado via NestJS DI container.
- **Use Case + Ports**: Regra de negócio em `use-cases`, dependências externas por interfaces (`ports`) e tokens DI.
- **Repository Pattern**: Adaptadores concretos (Prisma) implementam as portas de domínio.
- **DTOs (Data Transfer Objects)**: Usados para validação de entrada (com `class-validator`) e tipagem de dados.

### Tratamento de Erros

- Filtros globais de exceção (`src/core/errors`) padronizam as respostas de erro da API.

### Logs

- Sistema de logs estruturados (ex: Pino/Winston) configurado em `src/core/logger`.
