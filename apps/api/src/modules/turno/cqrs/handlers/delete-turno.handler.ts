/**
 * Handler para o Command DeleteTurnoCommand
 *
 * Implementa o padrão CQRS separando operações de escrita (Commands)
 * das operações de leitura (Queries).
 *
 * RESPONSABILIDADES:
 * - Processar comando de exclusão de turno
 * - Executar lógica de negócio de escrita
 * - Emitir eventos de domínio após exclusão
 * - Garantir transações e consistência
 *
 * @example
 * ```typescript
 * @CommandHandler(DeleteTurnoCommand)
 * export class DeleteTurnoHandler implements ICommandHandler<DeleteTurnoCommand> {
 *   async execute(command: DeleteTurnoCommand) { ... }
 * }
 * ```
 */

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';

import { TurnoResponseDto } from '../../dto/turno-response.dto';
import { TurnoDeletedEvent } from '../../events/turno-deleted.event';
import { TurnoService } from '../../services/turno.service';
import { DeleteTurnoCommand } from '../commands/delete-turno.command';

/**
 * Handler responsável por processar o comando de exclusão de turno
 */
@CommandHandler(DeleteTurnoCommand)
export class DeleteTurnoHandler implements ICommandHandler<DeleteTurnoCommand> {
  private readonly logger = new Logger(DeleteTurnoHandler.name);

  constructor(
    private readonly turnoService: TurnoService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Executa o comando de exclusão de turno
   *
   * @param command - Comando de exclusão de turno
   * @returns Turno removido
   */
  async execute(command: DeleteTurnoCommand): Promise<TurnoResponseDto> {
    this.logger.log(
      `Executando comando DeleteTurnoCommand - Turno ID: ${command.id}`
    );

    // Executa a lógica de negócio através do serviço
    const turno = await this.turnoService.remove(
      command.id,
      command.allowedContracts
    );

    // Emite evento de domínio para Event Sourcing
    this.eventBus.publish(
      new TurnoDeletedEvent(
        turno.id,
        new Date(),
        'system' // TODO: Obter userId do contexto
      )
    );

    this.logger.log(`Turno removido com sucesso via CQRS - ID: ${turno.id}`);

    return turno;
  }
}
