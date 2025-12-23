/**
 * Handler para o Command CloseTurnoCommand
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Processar comando de fechamento de turno
 * - Executar lógica de negócio de escrita
 * - Emitir eventos de domínio após fechamento
 * - Garantir transações e consistência
 *
 * @example
 * ```typescript
 * @CommandHandler(CloseTurnoCommand)
 * export class CloseTurnoHandler implements ICommandHandler<CloseTurnoCommand> {
 *   async execute(command: CloseTurnoCommand) { ... }
 * }
 * ```
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CloseTurnoCommand } from '../commands/close-turno.command';
import { TurnoService } from '../../services/turno.service';
import { TurnoClosedEvent } from '../../events/turno-closed.event';
import { TurnoResponseDto } from '../../dto/turno-response.dto';

/**
 * Handler responsável por processar o comando de fechamento de turno
 */
@CommandHandler(CloseTurnoCommand)
export class CloseTurnoHandler implements ICommandHandler<CloseTurnoCommand> {
  private readonly logger = new Logger(CloseTurnoHandler.name);

  constructor(
    private readonly turnoService: TurnoService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Executa o comando de fechamento de turno
   *
   * @param command - Comando de fechamento de turno
   * @returns Turno fechado
   */
  async execute(command: CloseTurnoCommand): Promise<TurnoResponseDto> {
    this.logger.log(
      `Executando comando CloseTurnoCommand - Turno ID: ${command.fecharDto.turnoId}`
    );

    // Executa a lógica de negócio através do serviço
    const turno = await this.turnoService.fecharTurno(
      command.fecharDto,
      command.allowedContracts
    );

    // Emite evento de domínio para Event Sourcing
    this.eventBus.publish(
      new TurnoClosedEvent(
        turno.id,
        turno.dataFim!,
        'system', // TODO: Obter userId do contexto
        turno.veiculoId,
        turno.equipeId
      )
    );

    this.logger.log(`Turno fechado com sucesso via CQRS - ID: ${turno.id}`);

    return turno;
  }
}

