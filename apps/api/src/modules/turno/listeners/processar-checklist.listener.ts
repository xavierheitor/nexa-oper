import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '../../../core/logger/app-logger';
import { ChecklistPreenchidoService } from '../checklist-preenchido/checklist-preenchido.service';
import { TurnoAbertoEvent } from '../events/turno-aberto.event';

@Injectable()
export class ProcessarChecklistListener {
  constructor(
    private readonly checklistPreenchidoService: ChecklistPreenchidoService,
    private readonly logger: AppLogger,
  ) {}

  @OnEvent('turno.aberto')
  async handle(event: TurnoAbertoEvent) {
    if (event.checklistPreenchidoIds.length === 0) return;

    try {
      await this.checklistPreenchidoService.processarChecklistsAssincrono(
        event.checklistPreenchidoIds,
      );
    } catch (err) {
      this.logger.error('Erro no processamento assíncrono de checklists', err, {
        turnoId: event.turnoId,
      });
    }
  }
}
