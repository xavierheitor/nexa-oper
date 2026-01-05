/**
 * Evento de domínio: Turno Fechado
 *
 * Representa o evento de fechamento de um turno no sistema.
 * Este evento é usado para Event Sourcing e auditoria completa.
 *
 * RESPONSABILIDADES:
 * - Capturar dados do evento de fechamento de turno
 * - Permitir reconstrução do estado através de eventos
 * - Facilitar auditoria e rastreabilidade
 *
 * @example
 * ```typescript
 * const event = new TurnoClosedEvent(id, dataHora, userId, veiculoId, equipeId);
 * eventBus.publish(event);
 * ```
 */

/**
 * Evento de domínio para fechamento de turno
 */
export class TurnoClosedEvent {
  constructor(
    public readonly id: number,
    public readonly dataHora: Date,
    public readonly userId: number | string,
    public readonly veiculoId: number,
    public readonly equipeId: number
  ) {}
}
