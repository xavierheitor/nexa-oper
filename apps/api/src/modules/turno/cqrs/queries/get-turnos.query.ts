/**
 * Query para buscar turnos com paginação e filtros
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Encapsular parâmetros de consulta
 * - Representar intenção de leitura no sistema
 * - Permitir cache e otimizações de leitura
 *
 * @example
 * ```typescript
 * const query = new GetTurnosQuery(params, allowedContracts);
 * const result = await queryBus.execute(query);
 * ```
 */

import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { IQuery } from '@nestjs/cqrs';

/**
 * Parâmetros para consulta de turnos
 */
export interface GetTurnosQueryParams {
  page: number;
  limit: number;
  search?: string;
  veiculoId?: number;
  equipeId?: number;
  eletricistaId?: number;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Query para buscar turnos com paginação e filtros
 */
export class GetTurnosQuery implements IQuery {
  constructor(
    public readonly params: GetTurnosQueryParams,
    public readonly allowedContracts: ContractPermission[]
  ) {}
}
