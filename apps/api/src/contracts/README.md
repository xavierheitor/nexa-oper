# API Contracts

Camada para contratos externos estáveis (request/response/error) expostos pela API.

## Objetivo

- Congelar shape de payloads consumidos por clientes.
- Detectar quebras de contrato em tempo de compilação (`tsc`) e lint.
- Desacoplar contratos públicos da estrutura interna de módulos.

## Convenções

- `shared/`: contratos globais (`envelope`, `error`, etc).
- `<modulo>/`: contratos específicos por contexto (ex.: `turno/abrir-turno.contract.ts`).
- Contratos devem ser tipos/interfaces puros (sem dependência de Nest/Prisma).

