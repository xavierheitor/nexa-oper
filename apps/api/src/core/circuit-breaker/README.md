# Circuit Breaker – Manual de uso

Módulo de **Circuit Breaker** para proteger chamadas externas e operações que podem falhar: evita falhas em cascata, dá tempo ao serviço se recuperar e permite fallback quando o circuito está aberto.

---

## Visão geral

| Recurso                   | O que é                                                                                                                    | Quando usar                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **CircuitBreakerService** | Serviço injetável que cria e reutiliza circuit breakers por nome. Usa [opossum](https://nodeshift.dev/opossum/) por baixo. | Em qualquer service que chame APIs externas, DB remoto, filas, etc.                          |
| **CircuitBreakerModule**  | Módulo Nest que exporta o `CircuitBreakerService`. Marcado como `@Global()`.                                               | Importar no `AppModule` (ou no módulo raiz) uma vez; depois injetar o service onde precisar. |

---

## Arquitetura

### Estados do circuito

O breaker alterna entre três estados:

1. **CLOSED** – Requisições passam normalmente. Falhas são contabilizadas.
2. **OPEN** – Requisições **não** executam a ação; o fallback é chamado (se existir) ou o erro é propagado. Após `resetTimeout`, o circuito passa para **HALF_OPEN**.
3. **HALF_OPEN** – Permite uma requisição de teste. Sucesso → **CLOSED**; falha → volta para **OPEN**.

### Fluxo no serviço

- Cada **nome** de circuito corresponde a um único breaker (criado na primeira chamada a `fire()` com esse nome).
- A **ação** do breaker é genérica: recebe uma função `() => Promise<T>` e apenas a executa (o breaker mede sucesso/falha e tempo).
- Eventos **open**, **halfOpen**, **close** e **failure** são logados via **AppLogger**.

### Dependências

- **opossum**: biblioteca que implementa o circuit breaker (tipos declarados em `src/types/opossum.d.ts`).
- **AppLogger**: usado para logar abertura/fechamento e falhas dos circuitos.

---

## 1. Onde e como configurar

### 1.1 Registrar no `AppModule`

Importe o **CircuitBreakerModule** no módulo raiz. Como o módulo é `@Global()`, o **CircuitBreakerService** fica disponível em qualquer módulo sem importar de novo.

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [CircuitBreakerModule],
  // ...
})
export class AppModule {}
```

O **CircuitBreakerService** depende de **AppLogger**; garanta que o módulo de logger (que fornece **AppLogger**) esteja disponível no mesmo módulo ou em um módulo importado pelo `AppModule`.

---

## 2. Como usar

### 2.1 Injetar o serviço

```ts
import { Injectable } from '@nestjs/common';
import { CircuitBreakerService } from './core/circuit-breaker/circuit-breaker.service';

@Injectable()
export class MeuService {
  constructor(private readonly breaker: CircuitBreakerService) {}
}
```

### 2.2 Executar uma operação protegida (`fire`)

Use **`fire(nome, fn, options?)`** para rodar uma função dentro do circuito. O mesmo **nome** reutiliza o mesmo breaker.

```ts
// Chamada HTTP externa
const dados = await this.breaker.fire('api-externa', () =>
  this.httpService.get('https://api.externa.com/dados').then((r) => r.data),
);

// Banco ou fila
const resultado = await this.breaker.fire(
  'fila-pagamentos',
  () => this.fila.enviar(mensagem),
  { timeout: 10_000, resetTimeout: 60_000 },
);
```

- **nome**: identificador único do circuito (ex.: `'api-externa'`, `'db-replica'`).
- **fn**: função que retorna `Promise<T>`; é ela que o breaker executa (ou não, se o circuito estiver aberto).
- **options**: opcional; timeout, percentual de erro, resetTimeout, fallback, etc. (só na primeira vez que esse nome é usado o breaker é criado; opções seguintes são ignoradas para esse nome).

### 2.3 Fallback (opcional)

Quando o circuito está **OPEN** (ou em falha), você pode fornecer um **fallback** para não falhar a requisição:

```ts
const resultado = await this.breaker.fire(
  'api-externa',
  () => this.chamarApi(),
  {
    fallback: () => ({ dados: [], origem: 'cache' }),
  },
);
```

O fallback é chamado quando o circuito está aberto ou quando a ação falha (conforme o comportamento do opossum). O retorno do fallback deve ser compatível com o tipo esperado pelo seu código (ou você trata como “resposta degradada”).

### 2.4 Estatísticas e gestão

- **`stats(nome)`** – retorna as estatísticas do breaker (ex.: sucessos, falhas, latência) ou `null` se não existir.
- **`list()`** – lista os nomes de todos os circuitos criados.
- **`remove(nome)`** – remove o breaker desse nome (próxima chamada `fire` com esse nome criará um novo).
- **`clear()`** – remove todos os breakers.

```ts
const estatisticas = this.breaker.stats('api-externa');
const circuitos = this.breaker.list();
this.breaker.remove('api-externa');
// this.breaker.clear();
```

---

## 3. Opções do circuito (`CircuitBreakerOptions`)

| Opção                        | Tipo          | Default | Descrição                                                                    |
| ---------------------------- | ------------- | ------- | ---------------------------------------------------------------------------- |
| **timeout**                  | number (ms)   | 3000    | Tempo máximo de execução da ação; após isso é considerado falha.             |
| **errorThresholdPercentage** | number        | 50      | Percentual de falhas na janela que abre o circuito.                          |
| **resetTimeout**             | number (ms)   | 30_000  | Tempo em OPEN antes de passar para HALF_OPEN.                                |
| **rollingCountTimeout**      | number (ms)   | 10_000  | Duração da janela de métricas.                                               |
| **rollingCountBuckets**      | number        | 10      | Número de buckets na janela.                                                 |
| **fallback**                 | () => unknown | -       | Função chamada quando o circuito está aberto ou em falha (conforme opossum). |

As opções são aplicadas **apenas na criação** do breaker (primeira vez que esse **nome** é usado em `fire`). Para alterar, use `remove(nome)` e chame `fire` de novo com as novas opções.

---

## 4. Boas práticas

- **Nomes únicos por dependência**: use um nome por recurso externo (ex.: `'api-pagamentos'`, `'db-replica'`) para isolar falhas.
- **Fallback útil**: quando usar fallback, retorne algo que a aplicação consiga tratar (ex.: lista vazia, cache, mensagem “serviço indisponível”) em vez de só relançar o erro.
- **Timeout adequado**: ajuste `timeout` para um pouco acima do tempo esperado da operação; evita abrir o circuito por lentidão temporária.
- **Logs**: o serviço já loga **open**, **halfOpen**, **close** e **failure**; use **AppLogger** no restante da app para manter rastreio.
- **Quando usar**: ideal para HTTP externo, clientes de fila, réplicas de DB, qualquer chamada que possa falhar em massa e derrubar o serviço.

---

## 5. Referência rápida

```ts
// Executar com opções (primeira vez cria o circuito)
await this.breaker.fire('meu-circuito', () => minhaOperacaoAsync(), {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  fallback: () => valorPadrao,
});

// Só executar (reutiliza circuito existente)
await this.breaker.fire('meu-circuito', () => minhaOperacaoAsync());

// Inspecionar
this.breaker.stats('meu-circuito');
this.breaker.list();
this.breaker.remove('meu-circuito');
this.breaker.clear();
```
