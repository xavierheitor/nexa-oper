/**
 * Evento de domínio: Turno Atualizado
 *
 * Representa o evento de atualização de um turno no sistema.
 * Este evento é usado para Event Sourcing e auditoria completa.
 *
 * RESPONSABILIDADES:
 * - Capturar dados do evento de atualização de turno
 * - Permitir reconstrução do estado através de eventos
 * - Facilitar auditoria e rastreabilidade
 *
 * @example
 * ```typescript
 * const event = new TurnoUpdatedEvent(id, dataHora, userId, changes);
 * eventBus.publish(event);
 * ```
 */

/**
 * Evento de domínio para atualização de turno
 */
export class TurnoUpdatedEvent {
  constructor(
    public readonly id: number,
    public readonly dataHora: Date,
    public readonly userId: number | string,
    public readonly changes: Record<string, any>
  ) {}
}
