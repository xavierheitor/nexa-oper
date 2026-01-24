/**
 * Command para fechar um turno existente
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Encapsular dados necessários para fechar um turno
 * - Validar dados de entrada
 * - Representar intenção de escrita no sistema
 *
 * @example
 * ```typescript
 * const command = new CloseTurnoCommand(fecharDto, allowedContracts);
 * await commandBus.execute(command);
 * ```
 */

import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { ICommand } from '@nestjs/cqrs';

import { FecharTurnoDto } from '../../dto/fechar-turno.dto';

/**
 * Command para fechar um turno existente
 */
export class CloseTurnoCommand implements ICommand {
  constructor(
    public readonly fecharDto: FecharTurnoDto,
    public readonly allowedContracts: ContractPermission[]
  ) {}
}
