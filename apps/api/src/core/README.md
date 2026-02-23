# Core (Núcleo)

Infraestrutura transversal da API: autenticação base, configuração, logging, tratamento de erros, interceptors e middlewares.

## Estrutura

- `auth/`: decorators e guard base (`@Public`, etc.)
- `config/`: carga/validação de env e bootstrap HTTP
- `errors/`: `AppError`, mensagens e filtro global
- `http/`: decorators, guards, pipes e interceptors HTTP
- `logger/`: `AppLogger`, middleware de contexto e logger Nest
- `middlewares/`: middlewares compartilhados
- `circuit-breaker/`: proteção para integrações externas

## Contratos transversais relevantes

- Envelope de resposta: `src/contracts/shared/api-envelope.contract.ts`
- Erro padronizado: `src/contracts/shared/api-error.contract.ts`

## Padrões

- Tudo que é regra de negócio fica em `src/modules/*`
- Core deve permanecer agnóstico de domínio
- Erros de negócio devem usar `AppError`
