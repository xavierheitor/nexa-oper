/**
 * Handler para o Command CreateTurnoCommand
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Processar comando de criação de turno
 * - Executar lógica de negócio de escrita
 * - Emitir eventos de domínio após criação
 * - Garantir transações e consistência
 *
 * @example
 * ```typescript
 * @CommandHandler(CreateTurnoCommand)
 * export class CreateTurnoHandler implements ICommandHandler<CreateTurnoCommand> {
 *   async execute(command: CreateTurnoCommand) { ... }
 * }
 * ```
 */

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';

import { TurnoResponseDto } from '../../dto/turno-response.dto';
import { TurnoCreatedEvent } from '../../events/turno-created.event';
import { TurnoService } from '../../services/turno.service';
import { CreateTurnoCommand } from '../commands/create-turno.command';

/**
 * Handler responsável por processar o comando de criação de turno
 */
@CommandHandler(CreateTurnoCommand)
export class CreateTurnoHandler implements ICommandHandler<CreateTurnoCommand> {
  private readonly logger = new Logger(CreateTurnoHandler.name);

  constructor(
    private readonly turnoService: TurnoService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Executa o comando de criação de turno
   *
   * @param command - Comando de criação de turno
   * @returns Turno criado
   */
  async execute(command: CreateTurnoCommand): Promise<TurnoResponseDto> {
    this.logger.log(
      `Executando comando CreateTurnoCommand - Veículo: ${command.abrirDto.veiculoId}, Equipe: ${command.abrirDto.equipeId}`
    );

    // Executa a lógica de negócio através do serviço
    const turno = await this.turnoService.abrirTurno(
      command.abrirDto,
      command.allowedContracts,
      command.userId
    );

    // Emite evento de domínio para Event Sourcing
    this.eventBus.publish(
      new TurnoCreatedEvent(
        turno.id,
        turno.dataInicio,
        command.userId || 'system',
        turno.veiculoId,
        turno.equipeId
      )
    );

    this.logger.log(`Turno criado com sucesso via CQRS - ID: ${turno.id}`);

    return turno;
  }
}
