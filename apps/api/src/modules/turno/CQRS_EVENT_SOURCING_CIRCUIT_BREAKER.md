# Implementação de CQRS, Event Sourcing e Circuit Breaker

Este documento descreve a implementação dos padrões CQRS, Event Sourcing e Circuit Breaker no módulo
de Turnos.

## 📋 Índice

1. [CQRS (Command Query Responsibility Segregation)](#cqrs)
2. [Event Sourcing](#event-sourcing)
3. [Circuit Breaker](#circuit-breaker)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Como Usar](#como-usar)

---

## 🎯 CQRS (Command Query Responsibility Segregation)

F

### Conceito

O padrão CQRS separa operações de **leitura (Queries)** das operações de **escrita (Commands)**,
permitindo:

- **Otimização independente**: Queries podem usar cache, índices otimizados, etc.
- **Escalabilidade**: Commands e Queries podem ser escalados separadamente
- **Manutenibilidade**: Código mais organizado e fácil de manter

### Implementação

#### Commands (Escrita)

- `CreateTurnoCommand`: Cria um novo turno
- `CloseTurnoCommand`: Fecha um turno existente

#### Queries (Leitura)

- `GetTurnosQuery`: Lista turnos com paginação e filtros
- `GetTurnoByIdQuery`: Busca um turno por ID
- `GetTurnosForSyncQuery`: Busca todos os turnos para sincronização mobile

#### Handlers

Cada Command e Query tem seu respectivo Handler que processa a lógica:

- `CreateTurnoHandler`: Processa criação de turno e emite eventos
- `CloseTurnoHandler`: Processa fechamento de turno e emite eventos
- `GetTurnosHandler`: Processa listagem de turnos (pode usar cache)
- `GetTurnoByIdHandler`: Processa busca por ID (pode usar cache)
- `GetTurnosForSyncHandler`: Processa sincronização (pode usar cache)

### Exemplo de Uso

```typescript
// No Controller
async abrirTurno(@Body() abrirDto: AbrirTurnoDto) {
  const command = new CreateTurnoCommand(abrirDto, allowedContracts);
  return this.commandBus.execute(command);
}

// Query
async findAll(@Query() query: TurnoQueryDto) {
  const getTurnosQuery = new GetTurnosQuery(params, allowedContracts);
  return this.queryBus.execute(getTurnosQuery);
}
```

---

## 📊 Event Sourcing

### Conceito

Event Sourcing captura todos os eventos de domínio que alteram o estado do sistema, permitindo:

- **Auditoria completa**: Rastreabilidade de todas as mudanças
- **Reconstrução do estado**: Possibilidade de reconstruir o estado em qualquer ponto no tempo
- **Histórico completo**: Histórico detalhado de todas as operações

### Eventos Implementados

- `TurnoCreatedEvent`: Disparado quando um turno é criado
- `TurnoClosedEvent`: Disparado quando um turno é fechado
- `TurnoUpdatedEvent`: Disparado quando um turno é atualizado
- `TurnoDeletedEvent`: Disparado quando um turno é deletado

### Event Handler

O `TurnoEventHandler` processa todos os eventos e os armazena para auditoria:

```typescript
@EventsHandler(TurnoCreatedEvent, TurnoClosedEvent, ...)
export class TurnoEventHandler implements IEventHandler {
  async handle(event: TurnoCreatedEvent | TurnoClosedEvent) {
    // Armazena evento no Event Store
    await this.storeEvent(event);
  }
}
```

### Fluxo

1. Controller recebe requisição
2. Command é executado via CommandBus
3. Handler processa o Command e executa a lógica de negócio
4. Handler emite evento de domínio via EventBus
5. EventHandler captura o evento e armazena no Event Store

---

## 🔌 Circuit Breaker

### Conceito

O Circuit Breaker protege o sistema contra falhas em cascata em chamadas externas:

- **Estados**: CLOSED (normal), OPEN (bloqueado), HALF_OPEN (testando)
- **Proteção**: Bloqueia requisições quando serviço está falhando
- **Recuperação**: Tenta reabrir o circuito após timeout
- **Fallback**: Retorna resposta padrão quando circuito está aberto

### Implementação

O `CircuitBreakerService` fornece:

- `create()`: Cria um novo Circuit Breaker
- `execute()`: Executa função protegida por Circuit Breaker
- `getStats()`: Obtém estatísticas do Circuit Breaker
- `list()`: Lista todos os Circuit Breakers criados

### Exemplo de Uso

```typescript
// Em um serviço
constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

async callExternalApi() {
  return this.circuitBreakerService.execute(
    'external-api',
    async () => {
      const response = await fetch('https://api.external.com/data');
      return response.json();
    },
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      fallback: () => ({ data: [], message: 'Serviço temporariamente indisponível' })
    }
  );
}
```

### Configuração

- `timeout`: Tempo limite em milissegundos (padrão: 3000ms)
- `errorThresholdPercentage`: Porcentagem de erros antes de abrir (padrão: 50%)
- `resetTimeout`: Tempo antes de tentar fechar novamente (padrão: 30000ms)
- `fallback`: Função a ser executada quando circuito está aberto

---

## 📁 Estrutura de Arquivos

```
turno/
├── cqrs/
│   ├── commands/
│   │   ├── create-turno.command.ts
│   │   └── close-turno.command.ts
│   ├── queries/
│   │   ├── get-turnos.query.ts
│   │   ├── get-turno-by-id.query.ts
│   │   └── get-turnos-for-sync.query.ts
│   ├── handlers/
│   │   ├── create-turno.handler.ts
│   │   ├── close-turno.handler.ts
│   │   ├── get-turnos.handler.ts
│   │   ├── get-turno-by-id.handler.ts
│   │   └── get-turnos-for-sync.handler.ts
│   └── index.ts
├── events/
│   ├── turno-created.event.ts
│   ├── turno-closed.event.ts
│   ├── turno-updated.event.ts
│   ├── turno-deleted.event.ts
│   ├── handlers/
│   │   └── turno-event.handler.ts
│   └── index.ts
├── controllers/
│   └── turno.controller.ts (atualizado para usar CQRS)
└── turno.module.ts (configurado com CQRS e Event Sourcing)

common/
└── circuit-breaker/
    ├── circuit-breaker.service.ts
    ├── circuit-breaker.module.ts
    └── index.ts
```

---

## 🚀 Como Usar

### 1. CQRS

Os Controllers já estão configurados para usar CQRS. Basta usar os Commands e Queries:

```typescript
// Criar turno
const command = new CreateTurnoCommand(abrirDto, allowedContracts);
const turno = await this.commandBus.execute(command);

// Listar turnos
const query = new GetTurnosQuery(params, allowedContracts);
const turnos = await this.queryBus.execute(query);
```

### 2. Event Sourcing

Os eventos são emitidos automaticamente pelos Handlers. Para adicionar novos eventos:

1. Crie o evento em `events/`
2. Adicione o evento no `TurnoEventHandler`
3. Emita o evento no Handler correspondente

### 3. Circuit Breaker

Para proteger chamadas externas:

```typescript
import { CircuitBreakerService } from '@common/circuit-breaker';

constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

async minhaOperacao() {
  return this.circuitBreakerService.execute(
    'nome-do-circuito',
    async () => {
      // Sua operação aqui
    },
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      fallback: () => ({ /* resposta padrão */ })
    }
  );
}
```

---

## 📝 Notas Importantes

1. **Event Store**: A implementação atual apenas loga os eventos. Para produção, considere:
   - Criar tabela de eventos no banco de dados
   - Usar Event Store dedicado (EventStore, Kafka, etc.)
   - Implementar reconstrução de estado

2. **Cache**: Queries podem ser otimizadas com cache. Considere implementar:
   - Cache em memória (Redis)
   - Cache de queries frequentes
   - Invalidação de cache quando Commands são executados

3. **Circuit Breaker**: Use para:
   - Chamadas HTTP externas
   - Operações de banco de dados que podem falhar
   - Integrações com serviços terceiros

4. **Monitoramento**: Considere adicionar:
   - Métricas de Circuit Breaker
   - Logs de eventos
   - Alertas quando circuitos abrem

---

## 🔄 Próximos Passos

1. Implementar Event Store no banco de dados
2. Adicionar cache para Queries
3. Implementar reconstrução de estado a partir de eventos
4. Adicionar métricas e monitoramento
5. Expandir uso de Circuit Breaker para outras operações

---

## 📚 Referências

- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Opossum (Circuit Breaker Library)](https://github.com/nodeshift/opossum)
