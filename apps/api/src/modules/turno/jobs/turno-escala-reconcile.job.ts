import * as os from 'node:os';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { env } from '../../../core/config/env';
import { PrismaService } from '../../../database/prisma.service';

const JOB_NAME = 'turno-escala-reconcile';

@Injectable()
export class TurnoEscalaReconcileJob {
  private readonly logger = new Logger(TurnoEscalaReconcileJob.name);
  private readonly instanceId = `${os.hostname()}:${process.pid}`;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(env.TURNO_RECONCILE_CRON || '0 2 * * *')
  async handleCron() {
    if (!env.TURNO_RECONCILE_ENABLED) {
      return;
    }

    const acquired = await this.acquireJobLock();
    if (!acquired) {
      this.logger.debug(
        'Job de reconciliação de turnos ignorado (lock ativo noutra instância).',
      );
      return;
    }

    const startedAt = Date.now();
    try {
      await this.runReconciliation();
      this.logger.log(
        `Job de reconciliação concluído em ${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      this.logger.error('Falha no job de reconciliação de turnos', error);
    } finally {
      await this.releaseJobLock();
    }
  }

  private async acquireJobLock(): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.TURNO_RECONCILE_LOCK_TTL_MS);

    await this.prisma.jobLock.upsert({
      where: { jobName: JOB_NAME },
      update: {},
      create: {
        jobName: JOB_NAME,
        lockedAt: null,
        lockedBy: null,
        expiresAt: null,
      },
    });

    const claim = await this.prisma.jobLock.updateMany({
      where: {
        jobName: JOB_NAME,
        OR: [
          { expiresAt: null },
          { expiresAt: { lt: now } },
          { lockedBy: this.instanceId },
        ],
      },
      data: {
        lockedAt: now,
        lockedBy: this.instanceId,
        expiresAt,
      },
    });

    return claim.count > 0;
  }

  private async releaseJobLock(): Promise<void> {
    const now = new Date();
    await this.prisma.jobLock.updateMany({
      where: {
        jobName: JOB_NAME,
        lockedBy: this.instanceId,
      },
      data: {
        expiresAt: now,
      },
    });
  }

  private async runReconciliation() {
    const endBoundary = new Date();
    endBoundary.setHours(0, 0, 0, 0);

    let faltasCreated = 0;

    // Use queryRaw to reliably cross-reference missing shifts locally, ensuring idempotency.
    // We look for any SlotEscala marked 'TRABALHO' strictly before today,
    // that lacks a 'Falta' record and lacks a 'TurnoRealizadoEletricista' on that same day.
    type PendingSlot = {
      id: number;
      data: Date;
      eletricistaId: number;
      equipeId: number;
    };

    const pendingSlots = await this.prisma.$queryRaw<PendingSlot[]>`
      SELECT se.id, se.data, se.eletricistaId, eep.equipeId
      FROM SlotEscala se
      JOIN EscalaEquipePeriodo eep ON se.escalaEquipePeriodoId = eep.id
      WHERE se.estado = 'TRABALHO'
        AND se.data < ${endBoundary}
        AND NOT EXISTS (
          SELECT 1 FROM Falta f 
          WHERE f.escalaSlotId = se.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM TurnoRealizadoEletricista tre
          JOIN TurnoRealizado tr ON tre.turnoRealizadoId = tr.id
          WHERE tre.eletricistaId = se.eletricistaId
            AND tr.dataReferencia = se.data
        )
    `;

    for (const slot of pendingSlots) {
      // Evita colisão direta caso haja faltas por outros motivos (ex: justificativas)
      const existingFalta = await this.prisma.falta.findFirst({
        where: {
          eletricistaId: slot.eletricistaId,
          dataReferencia: slot.data,
          equipeId: slot.equipeId,
        },
      });

      if (!existingFalta) {
        await this.prisma.falta.create({
          data: {
            dataReferencia: slot.data,
            eletricistaId: slot.eletricistaId,
            equipeId: slot.equipeId,
            escalaSlotId: slot.id,
            motivoSistema: 'falta_abertura',
            status: 'pendente',
            createdBy: 'cron-reconcile',
          },
        });
        faltasCreated++;
      }
    }

    this.logger.log(
      `Avaliados ${pendingSlots.length} slots pendentes. Geradas ${faltasCreated} faltas.`,
    );
  }
}
