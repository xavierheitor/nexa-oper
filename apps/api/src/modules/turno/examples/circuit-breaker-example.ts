/**
 * Exemplo de uso do Circuit Breaker
 *
 * Este arquivo demonstra como usar o Circuit Breaker para proteger
 * chamadas externas e operações que podem falhar.
 *
 * @example
 * ```typescript
 * // Em um serviço
 * constructor(private readonly circuitBreakerService: CircuitBreakerService) {}
 *
 * async callExternalApi() {
 *   return this.circuitBreakerService.execute(
 *     'external-api',
 *     async () => {
 *       const response = await fetch('https://api.external.com/data');
 *       return response.json();
 *     },
 *     {
 *       timeout: 5000,
 *       errorThresholdPercentage: 50,
 *       resetTimeout: 30000,
 *       fallback: () => ({ data: [], message: 'Serviço temporariamente indisponível' })
 *     }
 *   );
 * }
 * ```
 */

import { CircuitBreakerService } from '@common/circuit-breaker';
import { Injectable } from '@nestjs/common';

/**
 * Exemplo de serviço usando Circuit Breaker
 */
@Injectable()
export class ExampleServiceWithCircuitBreaker {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  /**
   * Exemplo: Chamada externa protegida por Circuit Breaker
   */
  async callExternalApi(): Promise<any> {
    return this.circuitBreakerService.execute(
      'external-api',
      async () => {
        // Simula chamada externa
        const response = await fetch('https://api.external.com/data');
        if (!response.ok) {
          throw new Error(`API retornou status ${response.status}`);
        }
        return response.json();
      },
      {
        timeout: 5000, // 5 segundos
        errorThresholdPercentage: 50, // Abre circuito após 50% de erros
        resetTimeout: 30000, // Tenta fechar após 30 segundos
        fallback: () => {
          // Retorna dados padrão quando circuito está aberto
          return {
            data: [],
            message: 'Serviço temporariamente indisponível',
            fromCache: false,
          };
        },
      }
    );
  }

  /**
   * Exemplo: Operação de banco de dados protegida
   */
  async performDatabaseOperation(): Promise<any> {
    return this.circuitBreakerService.execute(
      'database-operation',
      async () => {
        // Simula operação de banco que pode falhar
        // Em produção, seria uma chamada real ao banco
        throw new Error('Database connection failed');
      },
      {
        timeout: 3000,
        errorThresholdPercentage: 30,
        resetTimeout: 60000,
        fallback: () => {
          return {
            success: false,
            message: 'Operação temporariamente indisponível',
            retryAfter: 60,
          };
        },
      }
    );
  }
}
