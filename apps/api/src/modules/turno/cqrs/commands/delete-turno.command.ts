/**
 * Command para deletar um turno (soft delete)
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Encapsular dados necessários para deletar um turno
 * - Validar dados de entrada
 * - Representar intenção de escrita no sistema
 *
 * @example
 * ```typescript
 * const command = new DeleteTurnoCommand(id, allowedContracts);
 * await commandBus.execute(command);
 * ```
 */

import { ICommand } from '@nestjs/cqrs';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';

/**
 * Command para deletar um turno
 */
export class DeleteTurnoCommand implements ICommand {
  constructor(
    public readonly id: number,
    public readonly allowedContracts: ContractPermission[]
  ) {}
}


