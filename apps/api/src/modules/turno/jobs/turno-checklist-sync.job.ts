import * as os from 'node:os';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { env } from '../../../core/config/env';
import { PrismaService } from '../../../database/prisma.service';
import { TurnoChecklistSyncQueueService } from '../checklist-preenchido/turno-checklist-sync-queue.service';

const JOB_NAME = 'turno-checklist-sync';

@Injectable()
export class TurnoChecklistSyncJob {
  private readonly logger = new Logger(TurnoChecklistSyncJob.name);
  private readonly instanceId = `${os.hostname()}:${process.pid}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: TurnoChecklistSyncQueueService,
  ) {}

  @Cron(env.TURNO_CHECKLIST_SYNC_CRON || '*/1 * * * *')
  async handleCron() {
    if (!env.TURNO_CHECKLIST_SYNC_ENABLED) return;

    const acquired = await this.acquireJobLock();
    if (!acquired) return;

    try {
      await this.queueService.processDueItems({ limit: 50 });
    } catch (error) {
      this.logger.error('Falha no job de sincronização de checklists', error);
    } finally {
      await this.releaseJobLock();
    }
  }

  private async acquireJobLock(): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.TURNO_CHECKLIST_SYNC_LOCK_TTL_MS,
    );

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
    await this.prisma.jobLock.updateMany({
      where: { jobName: JOB_NAME, lockedBy: this.instanceId },
      data: {
        lockedAt: null,
        lockedBy: null,
        expiresAt: null,
      },
    });
  }
}
