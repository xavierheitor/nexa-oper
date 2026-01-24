# Quando adotar CQRS em novos módulos

Este documento descreve os critérios para decidir se um novo módulo da API deve usar o padrão CQRS (Command Query Responsibility Segregation). O CQRS está implementado atualmente **apenas no módulo de Turnos**; os demais usam o fluxo direto Controller → Service.

## Referência de implementação

- **[CQRS, Event Sourcing e Circuit Breaker no Turno](../apps/api/src/modules/turno/CQRS_EVENT_SOURCING_CIRCUIT_BREAKER.md)** – Implementação existente, estrutura de pastas, exemplos e fluxo.

## Quando considerar CQRS

Adote CQRS em um novo módulo quando **uma ou mais** das situações abaixo se aplicar:

### 1. Complexidade de negócio

- Muitas regras de validação e efeitos colaterais na escrita (ex.: abrir/fechar turno com checagens de conflito, duplicidade, integrações).
- Comandos com etapas bem definidas (criar, fechar, cancelar, reabrir) que se beneficiem de handlers dedicados e event sourcing.

### 2. Event Sourcing ou auditoria rica

- Necessidade de registrar **todos** os eventos de domínio (criado, alterado, fechado, deletado) para auditoria ou para reconstruir estado.
- Uso de `EventEmitterModule` e `@EventsHandler` para reações (logs, notificações, sincronização).

### 3. Separação clara entre leitura e escrita

- Escritas complexas (commands) e leituras com requisitos diferentes (queries para listagem, sync, relatórios, cache).
- Vontade de evoluir leituras (ex.: cache, views, leituras em outro banco) sem impactar a lógica de escrita.

### 4. Preparação para escalar leituras

- Possível escalar **apenas** as queries (réplicas de leitura, CQRS com banco de leitura dedicado) no futuro, mantendo commands no serviço principal.

## Quando NÃO usar CQRS

- CRUD simples com poucas regras e sem event sourcing.
- Módulos de suporte (ex.: tipos, catálogos) com leitura/escrita direta e sem necessidade de auditoria por eventos.
- Prioridade em entregar rápido: o fluxo Controller → Service é mais simples e suficiente na maior parte dos casos.

## Estrutura sugerida ao adotar CQRS

Seguir o que já existe no Turno:

```
modules/<modulo>/
├── cqrs/
│   ├── commands/       # CreateXxxCommand, UpdateXxxCommand, etc.
│   ├── queries/        # GetXxxQuery, GetXxxForSyncQuery, etc.
│   ├── handlers/       # *Handler (ICommandHandler / IQueryHandler)
│   └── index.ts
├── events/             # Eventos de domínio e TurnoEventHandler (ou XxxEventHandler)
├── controllers/
├── services/           # Lógica compartilhada; handlers delegam para o service
└── ...
```

- **Handlers**: concentram a orquestração; a lógica pesada fica no **Service**. Evitar duplicar regras entre handler e service.
- **Event Sourcing**: comandos emitem eventos; um `XxxEventHandler` escuta e persiste/ reage.
- **Módulo**: importar `CqrsModule` e registrar commands, queries e event handlers em `providers`.

## Melhoria futura

Quando um **segundo** módulo adotar CQRS, avaliar:

- Extrair em `common/` bases opcionais (ex.: `BaseQueryHandler`, `BaseCommandHandler`) e um guia de uso.
- Padronizar nomenclatura de comandos, queries e eventos em toda a API.
