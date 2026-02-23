/**
 * Declaração de tipos para o pacote `opossum` (não traz tipos próprios).
 * Mantém apenas a API usada pelo CircuitBreakerService.
 */
declare module 'opossum' {
  export interface OpossumOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
  }

  export default class CircuitBreaker<A extends unknown[], R> {
    constructor(action: (...args: A) => Promise<R>, options?: OpossumOptions);

    fire(...args: A): Promise<R>;
    on(event: string, callback: (...args: unknown[]) => void): void;
    fallback(fn: () => R | Promise<R>): void;
    readonly stats: unknown;
    shutdown(): void;
  }
}
