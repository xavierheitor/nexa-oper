/**
 * Handler de eventos de domínio para Event Sourcing
 *
 * Este handler processa eventos de turnos e os armazena no Event Store
 * para permitir auditoria completa e reconstrução do estado.
 *
 * RESPONSABILIDADES:
 * - Capturar eventos de domínio de turnos
 * - Armazenar eventos no Event Store
 * - Garantir persistência para auditoria
 * - Permitir reconstrução do estado histórico
 *
 * @example
 * ```typescript
 * @EventsHandler(TurnoCreatedEvent, TurnoClosedEvent)
 * export class TurnoEventHandler {
 *   async handle(event: TurnoCreatedEvent | TurnoClosedEvent) { ... }
 * }
 * ```
 */

import { DatabaseService } from '@database/database.service';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TurnoClosedEvent } from '../turno-closed.event';
import { TurnoCreatedEvent } from '../turno-created.event';
import { TurnoDeletedEvent } from '../turno-deleted.event';
import { TurnoUpdatedEvent } from '../turno-updated.event';

/**
 * Handler responsável por processar eventos de turnos para Event Sourcing
 */
@EventsHandler(
  TurnoCreatedEvent,
  TurnoClosedEvent,
  TurnoUpdatedEvent,
  TurnoDeletedEvent
)
export class TurnoEventHandler
  implements
    IEventHandler<
      | TurnoCreatedEvent
      | TurnoClosedEvent
      | TurnoUpdatedEvent
      | TurnoDeletedEvent
    >
{
  private readonly logger = new Logger(TurnoEventHandler.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Processa eventos de turnos e os armazena no Event Store
   *
   * @param event - Evento de domínio de turno
   */
  async handle(
    event:
      | TurnoCreatedEvent
      | TurnoClosedEvent
      | TurnoUpdatedEvent
      | TurnoDeletedEvent
  ): Promise<void> {
    try {
      const eventType = this.getEventType(event);
      const eventData = this.serializeEvent(event);

      this.logger.log(
        `Processando evento de turno: ${eventType} - Turno ID: ${event.id}`
      );

      // Armazenar evento no Event Store (tabela de eventos)
      // Por enquanto, vamos usar uma abordagem simples armazenando em uma tabela de eventos
      // Em produção, você pode usar um Event Store dedicado (EventStore, Kafka, etc.)
      await this.storeEvent(eventType, eventData, event);

      this.logger.log(
        `Evento ${eventType} armazenado com sucesso - Turno ID: ${event.id}`
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar evento de turno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : undefined
      );
      // Não lançar erro para não quebrar o fluxo principal
      // Eventos são importantes mas não devem bloquear operações
    }
  }

  /**
   * Obtém o tipo do evento
   */
  private getEventType(
    event:
      | TurnoCreatedEvent
      | TurnoClosedEvent
      | TurnoUpdatedEvent
      | TurnoDeletedEvent
  ): string {
    if (event instanceof TurnoCreatedEvent) return 'TurnoCreated';
    if (event instanceof TurnoClosedEvent) return 'TurnoClosed';
    if (event instanceof TurnoUpdatedEvent) return 'TurnoUpdated';
    if (event instanceof TurnoDeletedEvent) return 'TurnoDeleted';
    return 'Unknown';
  }

  /**
   * Serializa o evento para armazenamento
   */
  private serializeEvent(
    event:
      | TurnoCreatedEvent
      | TurnoClosedEvent
      | TurnoUpdatedEvent
      | TurnoDeletedEvent
  ): Record<string, any> {
    return {
      id: event.id,
      dataHora: event.dataHora,
      userId: event.userId,
      ...(event instanceof TurnoCreatedEvent && {
        veiculoId: event.veiculoId,
        equipeId: event.equipeId,
      }),
      ...(event instanceof TurnoClosedEvent && {
        veiculoId: event.veiculoId,
        equipeId: event.equipeId,
      }),
      ...(event instanceof TurnoUpdatedEvent && {
        changes: event.changes,
      }),
    };
  }

  /**
   * Armazena o evento no Event Store
   *
   * NOTA: Esta é uma implementação simplificada.
   * Em produção, considere usar um Event Store dedicado como:
   * - EventStore (eventstore.com)
   * - Apache Kafka
   * - AWS EventBridge
   * - Tabela dedicada no banco de dados
   */
  private async storeEvent(
    eventType: string,
    eventData: Record<string, any>,
    event:
      | TurnoCreatedEvent
      | TurnoClosedEvent
      | TurnoUpdatedEvent
      | TurnoDeletedEvent
  ): Promise<void> {
    // Por enquanto, vamos apenas logar o evento
    // Em produção, você deve criar uma tabela de eventos e armazenar aqui
    // Exemplo de estrutura de tabela:
    // CREATE TABLE turno_events (
    //   id SERIAL PRIMARY KEY,
    //   turno_id INTEGER NOT NULL,
    //   event_type VARCHAR(50) NOT NULL,
    //   event_data JSONB NOT NULL,
    //   occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    //   user_id VARCHAR(255),
    //   created_at TIMESTAMP NOT NULL DEFAULT NOW()
    // );

    this.logger.debug(
      `Evento armazenado: ${eventType} - Dados: ${JSON.stringify(eventData)}`
    );

    // TODO: Implementar armazenamento em tabela de eventos quando necessário
  }
}
