/**
 * Query para buscar um turno por ID
 *
 * Implementa o padrão CQRS separando operações de leitura (Queries)
 * das operações de escrita (Commands).
 *
 * RESPONSABILIDADES:
 * - Encapsular parâmetros de consulta por ID
 * - Representar intenção de leitura no sistema
 * - Permitir cache e otimizações de leitura
 *
 * @example
 * ```typescript
 * const query = new GetTurnoByIdQuery(id, allowedContracts);
 * const result = await queryBus.execute(query);
 * ```
 */

import { IQuery } from '@nestjs/cqrs';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';

/**
 * Query para buscar um turno por ID
 */
export class GetTurnoByIdQuery implements IQuery {
  constructor(
    public readonly id: number,
    public readonly allowedContracts: ContractPermission[]
  ) {}
}

