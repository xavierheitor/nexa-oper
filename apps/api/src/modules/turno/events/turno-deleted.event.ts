/**
 * Evento de domínio: Turno Deletado
 *
 * Representa o evento de exclusão (soft delete) de um turno no sistema.
 * Este evento é usado para Event Sourcing e auditoria completa.
 *
 * RESPONSABILIDADES:
 * - Capturar dados do evento de exclusão de turno
 * - Permitir reconstrução do estado através de eventos
 * - Facilitar auditoria e rastreabilidade
 *
 * @example
 * ```typescript
 * const event = new TurnoDeletedEvent(id, dataHora, userId);
 * eventBus.publish(event);
 * ```
 */

/**
 * Evento de domínio para exclusão de turno
 */
export class TurnoDeletedEvent {
  constructor(
    public readonly id: number,
    public readonly dataHora: Date,
    public readonly userId: number | string
  ) {}
}

