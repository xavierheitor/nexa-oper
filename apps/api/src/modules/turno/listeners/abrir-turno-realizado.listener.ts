import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TurnoRealizadoService } from '../turno-realizado/turno-realizado.service';
import { TurnoAbertoEvent } from '../events/turno-aberto.event';

@Injectable()
export class AbrirTurnoRealizadoListener {
  constructor(private readonly turnoRealizadoService: TurnoRealizadoService) {}

  @OnEvent('turno.aberto')
  async handle(event: TurnoAbertoEvent) {
    await this.turnoRealizadoService.abrirTurno({
      equipeId: event.equipeId,
      dataReferencia: event.dataReferencia,
      eletricistas: event.eletricistas,
      turnoId: event.turnoId,
      origem: 'mobile',
      abertoPor: 'system',
      deviceInfo: event.dispositivo,
    });
  }
}
