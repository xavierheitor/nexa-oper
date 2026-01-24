# Circuit Breaker

Implementação do padrão Circuit Breaker (via [opossum](https://nodeshift.dev/opossum/)) para proteger contra falhas em cascata em chamadas externas e operações que podem falhar.

## Quando usar

- **Chamadas HTTP externas:** APIs de terceiros, gateways de pagamento, serviços de notificação.
- **Integrações:** sistemas externos que podem ficar indisponíveis ou lentos.
- **I/O que pode falhar em cascata:** qualquer operação externa onde falhas repetidas não devem derrubar ou sobrecarregar a aplicação.

Não é necessário para operações puramente internas (ex.: Prisma no mesmo processo) a menos que o banco esteja em outro host e queira isolar falhas de rede.

## Como usar

### 1. Importar o módulo

No módulo que fará chamadas protegidas:

```typescript
import { CircuitBreakerModule } from '@common/circuit-breaker';

@Module({
  imports: [CircuitBreakerModule, /* ... */],
  // ...
})
export class MeuModulo {}
```

### 2. Injetar e criar o breaker

```typescript
import { CircuitBreakerService } from '@common/circuit-breaker';

@Injectable()
export class MeuService {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  async chamarExterna(): Promise<AlgumTipo> {
    const breaker = this.circuitBreakerService.create<AlgumTipo>('minha-api', {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      fallback: () => ({ /* valor padrão em caso de circuito aberto */ }),
    });
    return breaker.fire(() => this.httpService.get('https://...').then(r => r.data));
  }
}
```

Ou use `execute` para envolver uma função existente:

```typescript
const result = await this.circuitBreakerService.execute(
  () => this.repositorioExterno.buscar(id),
  { name: 'repositorio-externo', timeout: 3000 }
);
```

### 3. Estatísticas (opcional)

```typescript
const stats = this.circuitBreakerService.getStats('minha-api');
// { failures, fallbacks, successes, rejects, opens, ... }
```

## Estado atual

**Nenhum módulo da API utiliza o Circuit Breaker no fluxo de produção.** O `CircuitBreakerModule` e o `CircuitBreakerService` ficam em `@common/circuit-breaker` para uso quando houver integrações HTTP ou I/O externa que se beneficiem do padrão.
