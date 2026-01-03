/**
 * Evento de domínio: Turno Criado
 *
 * Representa o evento de criação de um turno no sistema.
 * Este evento é usado para Event Sourcing e auditoria completa.
 *
 * RESPONSABILIDADES:
 * - Capturar dados do evento de criação de turno
 * - Permitir reconstrução do estado através de eventos
 * - Facilitar auditoria e rastreabilidade
 *
 * @example
 * ```typescript
 * const event = new TurnoCreatedEvent(id, dataHora, userId, veiculoId, equipeId);
 * eventBus.publish(event);
 * ```
 */

/**
 * Evento de domínio para criação de turno
 */
export class TurnoCreatedEvent {
  constructor(
    public readonly id: number,
    public readonly dataHora: Date,
    public readonly userId: number | string,
    public readonly veiculoId: number,
    public readonly equipeId: number
  ) {}
}
