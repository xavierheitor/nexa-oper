import { Injectable } from '@nestjs/common';
import type { Prisma } from '@nexa-oper/db';
import type { AbrirTurnoChecklistItemContract } from '../../../contracts/turno/abrir-turno.contract';
import { AppLogger } from '../../../core/logger/app-logger';
import { PrismaService } from '../../../database/prisma.service';
import { ChecklistPreenchidoService } from './checklist-preenchido.service';

const STALE_PROCESSING_MS = 5 * 60 * 1000;
const BASE_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

@Injectable()
export class TurnoChecklistSyncQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checklistPreenchidoService: ChecklistPreenchidoService,
    private readonly logger: AppLogger,
  ) {}

  async enqueueInTransaction(
    tx: Prisma.TransactionClient,
    input: {
      turnoId: number;
      checklists: AbrirTurnoChecklistItemContract[];
      createdBy: string;
    },
  ): Promise<number> {
    const row = await tx.turnoChecklistSyncQueue.create({
      data: {
        turnoId: input.turnoId,
        payload: input.checklists as unknown as Prisma.InputJsonValue,
        createdBy: input.createdBy,
      },
      select: { id: true },
    });

    return row.id;
  }

  processPendingForTurno(turnoId: number): void {
    void this.processDueItems({ turnoId }).catch((error: unknown) => {
      this.logger.error(
        'Falha ao processar fila de checklists do turno',
        error,
        { turnoId },
      );
    });
  }

  async processDueItems(options?: { turnoId?: number; limit?: number }) {
    await this.releaseStaleProcessing();

    const now = new Date();
    const items = await this.prisma.turnoChecklistSyncQueue.findMany({
      where: {
        ...(options?.turnoId != null ? { turnoId: options.turnoId } : {}),
        status: { in: ['pending', 'failed'] },
        nextAttemptAt: { lte: now },
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }],
      take: options?.limit ?? 20,
      select: { id: true },
    });

    for (const item of items) {
      await this.processQueueItem(item.id);
    }
  }

  private async releaseStaleProcessing(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
    await this.prisma.turnoChecklistSyncQueue.updateMany({
      where: {
        status: 'processing',
        updatedAt: { lt: staleBefore },
      },
      data: {
        status: 'pending',
        updatedBy: 'system',
      },
    });
  }

  private async processQueueItem(queueId: number): Promise<void> {
    const claimed = await this.prisma.turnoChecklistSyncQueue.updateMany({
      where: {
        id: queueId,
        status: { in: ['pending', 'failed'] },
        nextAttemptAt: { lte: new Date() },
      },
      data: {
        status: 'processing',
        updatedBy: 'system',
      },
    });

    if (claimed.count === 0) return;

    const item = await this.prisma.turnoChecklistSyncQueue.findUnique({
      where: { id: queueId },
    });
    if (!item) return;

    const checklists = this.parsePayload(item.payload);
    if (!checklists.length) {
      await this.markCompleted(queueId, [], 'system');
      return;
    }

    try {
      const result =
        await this.checklistPreenchidoService.salvarChecklistsDoTurno({
          turnoId: item.turnoId,
          checklists,
          createdBy: item.createdBy,
        });

      const checklistPreenchidoIds = [
        ...new Set(result.checklistPreenchidoIds),
      ];

      if (checklistPreenchidoIds.length > 0) {
        await this.checklistPreenchidoService.processarChecklistsAssincrono(
          checklistPreenchidoIds,
        );
      }

      await this.markCompleted(
        queueId,
        checklistPreenchidoIds,
        item.createdBy,
      );

      this.logger.info('Checklists da abertura de turno processados', {
        queueId,
        turnoId: item.turnoId,
        count: checklistPreenchidoIds.length,
      });
    } catch (error: unknown) {
      await this.markFailure(queueId, item, error);
    }
  }

  private parsePayload(
    payload: Prisma.JsonValue,
  ): AbrirTurnoChecklistItemContract[] {
    if (!Array.isArray(payload)) return [];

    return payload as unknown as AbrirTurnoChecklistItemContract[];
  }

  private async markCompleted(
    queueId: number,
    checklistPreenchidoIds: number[],
    updatedBy: string,
  ) {
    await this.prisma.turnoChecklistSyncQueue.update({
      where: { id: queueId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        checklistPreenchidoIds,
        lastError: null,
        updatedBy,
      },
    });
  }

  private async markFailure(
    queueId: number,
    item: {
      attemptCount: number;
      maxAttempts: number;
      turnoId: number;
    },
    error: unknown,
  ) {
    const attemptCount = item.attemptCount + 1;
    const message = this.extractErrorMessage(error);
    const isDead = attemptCount >= item.maxAttempts;
    const retryDelay = Math.min(
      MAX_RETRY_DELAY_MS,
      BASE_RETRY_DELAY_MS * 2 ** Math.max(attemptCount - 1, 0),
    );

    await this.prisma.turnoChecklistSyncQueue.update({
      where: { id: queueId },
      data: {
        status: isDead ? 'dead_letter' : 'failed',
        attemptCount,
        lastError: message,
        nextAttemptAt: isDead
          ? undefined
          : new Date(Date.now() + retryDelay),
        updatedBy: 'system',
      },
    });

    const logPayload = {
      queueId,
      turnoId: item.turnoId,
      attemptCount,
      maxAttempts: item.maxAttempts,
    };

    if (isDead) {
      this.logger.error(
        'Checklists da abertura de turno esgotaram tentativas',
        error,
        logPayload,
      );
      return;
    }

    this.logger.warn(
      'Falha ao processar checklists da abertura de turno; nova tentativa agendada',
      {
        ...logPayload,
        nextRetryInMs: retryDelay,
        error: message,
      },
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido ao processar checklists';
    }
  }
}
