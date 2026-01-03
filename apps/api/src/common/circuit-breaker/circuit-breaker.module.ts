/**
 * Módulo de Circuit Breaker
 *
 * Fornece funcionalidade de Circuit Breaker para proteger contra falhas
 * em cascata em chamadas externas e operações que podem falhar.
 *
 * RESPONSABILIDADES:
 * - Exportar CircuitBreakerService para uso em outros módulos
 * - Configurar Circuit Breakers globais se necessário
 * - Fornecer decorators e utilitários para facilitar uso
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CircuitBreakerModule],
 *   providers: [MyService],
 * })
 * export class MyModule {}
 * ```
 */

import { Module, Global } from '@nestjs/common';

import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * Módulo responsável por fornecer funcionalidade de Circuit Breaker
 *
 * Este módulo é marcado como @Global() para que possa ser usado
 * em qualquer módulo sem necessidade de importação explícita.
 */
@Global()
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}
