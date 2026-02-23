import { Injectable } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { AppLogger } from '../logger/app-logger';

/**
 * Opções de configuração para o Circuit Breaker.
 */
export interface CircuitBreakerOptions {
  /** Tempo limite em ms após o qual a operação será abortada (Timeout). Default: 3000ms. */
  timeout?: number;
  /** Porcentagem de erros (0-100) para abrir o circuito. Default: 50%. */
  errorThresholdPercentage?: number;
  /** Tempo em ms para tentar fechar o circuito novamente (Half-Open). Default: 30000ms. */
  resetTimeout?: number;
  /** Janela de tempo em ms para contabilizar estatísticas de erro. Default: 10000ms. */
  rollingCountTimeout?: number;
  /** Número de buckets na janela de estatísticas. Default: 10. */
  rollingCountBuckets?: number;
  /** Função de fallback a ser executada em caso de falha ou circuito aberto. */
  fallback?: () => unknown;
}

type ActionArg = () => Promise<unknown>;
type Breaker = CircuitBreaker<[ActionArg], unknown>;

/**
 * Serviço de Circuit Breaker para tolerância a falhas.
 *
 * Utiliza a biblioteca `opossum` para proteger chamadas externas (HTTP, Banco, etc).
 * Se o serviço externo falhar repetidamente, o circuito "abre" para evitar sobrecarga (Fail Fast).
 */
@Injectable()
export class CircuitBreakerService {
  private readonly breakers = new Map<string, Breaker>();

  constructor(private readonly log: AppLogger) {}

  /**
   * Executa uma função protegida pelo Circuit Breaker.
   * Cria o circuito automaticamente se não existir.
   *
   * @param name - Nome único do circuito.
   * @param fn - Função assíncrona a ser executada.
   * @param options - Opções (timeout, thresholds, etc).
   * @returns O resultado da função executada.
   */
  async fire<T>(
    name: string,
    fn: () => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): Promise<T> {
    const breaker = this.getOrCreate(name, options);
    return breaker.fire(fn) as Promise<T>;
  }

  /**
   * Retorna estatísticas do circuito (sucessos, falhas, latência, etc).
   */
  stats(name: string): unknown {
    return this.breakers.get(name)?.stats ?? null;
  }

  /**
   * Lista os nomes de todos os circuitos ativos.
   */
  list(): string[] {
    return [...this.breakers.keys()];
  }

  /**
   * Remove um circuito da memória.
   */
  remove(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.shutdown();
      this.breakers.delete(name);
    }
  }

  /**
   * Remove todos os circuitos.
   */
  clear(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    this.breakers.clear();
  }

  /**
   * Cria ou recupera um CircuitBreaker existente.
   * Configura logs para eventos (Open, Close, Failure).
   */
  private getOrCreate(
    name: string,
    options: CircuitBreakerOptions = {},
  ): Breaker {
    const existing = this.breakers.get(name);
    if (existing) return existing;

    const config: Required<Omit<CircuitBreakerOptions, 'fallback'>> = {
      timeout: options.timeout ?? 3000,
      errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
      resetTimeout: options.resetTimeout ?? 30_000,
      rollingCountTimeout: options.rollingCountTimeout ?? 10_000,
      rollingCountBuckets: options.rollingCountBuckets ?? 10,
    };

    const action = async (fn: ActionArg) => await fn();
    const breaker = new CircuitBreaker<[ActionArg], unknown>(action, config);

    if (options.fallback) {
      breaker.fallback(options.fallback);
    }

    // Monitoramento de eventos
    breaker.on('open', () => this.log.warn(`Circuit "${name}" OPEN`));
    breaker.on('halfOpen', () => this.log.info(`Circuit "${name}" HALF_OPEN`));
    breaker.on('close', () => this.log.info(`Circuit "${name}" CLOSED`));
    breaker.on('failure', (err: Error) =>
      this.log.warn(`Circuit "${name}" FAILURE`, { message: err.message }),
    );

    this.breakers.set(name, breaker);
    this.log.info(`Circuit "${name}" created`, config);

    return breaker;
  }
}
