/**
 * Serviço de Circuit Breaker
 *
 * Implementa o padrão Circuit Breaker para proteger contra falhas em cascata
 * em chamadas externas e operações que podem falhar.
 *
 * RESPONSABILIDADES:
 * - Proteger chamadas externas contra falhas repetidas
 * - Prevenir falhas em cascata
 * - Fornecer fallback quando o circuito está aberto
 * - Monitorar saúde de serviços externos
 *
 * ESTADOS DO CIRCUIT BREAKER:
 * - CLOSED: Circuito fechado, requisições passam normalmente
 * - OPEN: Circuito aberto, requisições são bloqueadas (fallback)
 * - HALF_OPEN: Circuito meio aberto, testando se o serviço recuperou
 *
 * @example
 * ```typescript
 * const circuitBreaker = circuitBreakerService.create('external-api', {
 *   timeout: 3000,
 *   errorThresholdPercentage: 50,
 *   resetTimeout: 30000
 * });
 *
 * const result = await circuitBreaker.fire(() => externalApiCall());
 * ```
 */

import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker = require('opossum');

/**
 * Opções de configuração do Circuit Breaker
 */
export interface CircuitBreakerOptions {
  /**
   * Tempo limite em milissegundos para a operação
   * @default 3000
   */
  timeout?: number;

  /**
   * Porcentagem de erros antes de abrir o circuito
   * @default 50
   */
  errorThresholdPercentage?: number;

  /**
   * Tempo em milissegundos antes de tentar fechar o circuito novamente
   * @default 30000
   */
  resetTimeout?: number;

  /**
   * Número de requisições para monitorar antes de decidir abrir o circuito
   * @default 10
   */
  rollingCountTimeout?: number;

  /**
   * Número de requisições para manter no rolling window
   * @default 10
   */
  rollingCountBuckets?: number;

  /**
   * Função de fallback quando o circuito está aberto
   */
  fallback?: () => Promise<any> | any;
}

/**
 * Serviço responsável por gerenciar Circuit Breakers
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker<[], any>>();

  /**
   * Cria ou retorna um Circuit Breaker existente
   *
   * @param name - Nome identificador do Circuit Breaker
   * @param options - Opções de configuração
   * @returns Instância do Circuit Breaker
   */
  create<T = any>(
    name: string,
    options: CircuitBreakerOptions = {}
  ): CircuitBreaker<[], T> {
    // Retorna Circuit Breaker existente se já foi criado
    if (this.breakers.has(name)) {
      return this.breakers.get(name)! as CircuitBreaker<[], T>;
    }

    // Configurações padrão
    const defaultOptions: CircuitBreakerOptions = {
      timeout: 3000, // 3 segundos
      errorThresholdPercentage: 50, // 50% de erros
      resetTimeout: 30000, // 30 segundos
      rollingCountTimeout: 10000, // 10 segundos
      rollingCountBuckets: 10,
    };

    const config = { ...defaultOptions, ...options };

    // Cria novo Circuit Breaker
    const breaker = new CircuitBreaker<[], T>(
      async (): Promise<T> => {
        // Esta função será substituída quando usar .fire()
        throw new Error('Função não fornecida');
      },
      {
        timeout: config.timeout,
        errorThresholdPercentage: config.errorThresholdPercentage,
        resetTimeout: config.resetTimeout,
        rollingCountTimeout: config.rollingCountTimeout,
        rollingCountBuckets: config.rollingCountBuckets,
      }
    );

    // Configura fallback se fornecido
    if (config.fallback) {
      breaker.fallback(config.fallback);
    }

    // Event listeners para monitoramento
    breaker.on('open', () => {
      this.logger.warn(
        `Circuit Breaker "${name}" ABERTO - Bloqueando requisições`
      );
    });

    breaker.on('halfOpen', () => {
      this.logger.log(
        `Circuit Breaker "${name}" MEIO ABERTO - Testando recuperação`
      );
    });

    breaker.on('close', () => {
      this.logger.log(
        `Circuit Breaker "${name}" FECHADO - Requisições normalizadas`
      );
    });

    breaker.on('failure', (error: Error) => {
      this.logger.error(
        `Circuit Breaker "${name}" - Falha detectada: ${error.message}`
      );
    });

    breaker.on('success', () => {
      this.logger.debug(`Circuit Breaker "${name}" - Requisição bem-sucedida`);
    });

    // Armazena o Circuit Breaker
    this.breakers.set(name, breaker);

    this.logger.log(
      `Circuit Breaker "${name}" criado com sucesso - Timeout: ${config.timeout}ms, Threshold: ${config.errorThresholdPercentage}%`
    );

    return breaker;
  }

  /**
   * Executa uma função protegida por Circuit Breaker
   *
   * @param name - Nome do Circuit Breaker
   * @param fn - Função a ser executada
   * @param options - Opções de configuração (opcional)
   * @returns Resultado da função ou fallback
   */
  async execute<T = any>(
    name: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    // Cria um novo Circuit Breaker temporário para esta função específica
    const functionBreaker = new CircuitBreaker<[], T>(fn, {
      timeout: options?.timeout || 3000,
      errorThresholdPercentage: options?.errorThresholdPercentage || 50,
      resetTimeout: options?.resetTimeout || 30000,
    });

    // Configura fallback se fornecido
    if (options?.fallback) {
      functionBreaker.fallback(options.fallback);
    }

    // Event listeners
    functionBreaker.on('open', () => {
      this.logger.warn(`Circuit Breaker "${name}" ABERTO - Usando fallback`);
    });

    try {
      return await functionBreaker.fire();
    } catch (error) {
      this.logger.error(
        `Erro ao executar função protegida por Circuit Breaker "${name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
      throw error;
    }
  }

  /**
   * Obtém estatísticas de um Circuit Breaker
   *
   * @param name - Nome do Circuit Breaker
   * @returns Estatísticas do Circuit Breaker ou null se não existir
   */
  getStats(name: string): CircuitBreaker.Stats | null {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return null;
    }

    return breaker.stats;
  }

  /**
   * Lista todos os Circuit Breakers criados
   *
   * @returns Array com nomes dos Circuit Breakers
   */
  list(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Remove um Circuit Breaker
   *
   * @param name - Nome do Circuit Breaker a ser removido
   */
  remove(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      // CircuitBreaker não tem método destroy, apenas remove do Map
      this.breakers.delete(name);
      this.logger.log(`Circuit Breaker "${name}" removido`);
    }
  }

  /**
   * Remove todos os Circuit Breakers
   */
  clear(): void {
    this.breakers.clear();
    this.logger.log('Todos os Circuit Breakers foram removidos');
  }
}
