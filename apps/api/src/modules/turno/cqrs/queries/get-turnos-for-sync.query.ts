/**
 * Query para buscar todos os turnos para sincronização mobile
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Encapsular parâmetros de sincronização
 * - Representar intenção de leitura no sistema
 * - Permitir cache e otimizações de leitura
 *
 * @example
 * ```typescript
 * const query = new GetTurnosForSyncQuery(allowedContracts);
 * const result = await queryBus.execute(query);
 * ```
 */

import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { IQuery } from '@nestjs/cqrs';

/**
 * Query para buscar todos os turnos para sincronização mobile
 */
export class GetTurnosForSyncQuery implements IQuery {
  constructor(public readonly allowedContracts: ContractPermission[]) {}
}
