/**
 * Command para criar um novo turno
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Encapsular dados necessários para criar um turno
 * - Validar dados de entrada
 * - Representar intenção de escrita no sistema
 *
 * @example
 * ```typescript
 * const command = new CreateTurnoCommand(abrirDto, allowedContracts, userId);
 * await commandBus.execute(command);
 * ```
 */

import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { ICommand } from '@nestjs/cqrs';

import { AbrirTurnoDto } from '../../dto/abrir-turno.dto';

/**
 * Command para criar um novo turno
 */
export class CreateTurnoCommand implements ICommand {
  constructor(
    public readonly abrirDto: AbrirTurnoDto,
    public readonly allowedContracts: ContractPermission[],
    public readonly userId?: string
  ) {}
}
