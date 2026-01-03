/**
 * Serviço de Reconciliação Interna de Turnos
 *
 * Este serviço implementa a lógica de reconciliação de turnos, comparando
 * turnos realizados com escala planejada e gerando faltas, divergências e horas extras.
 *
 * A reconciliação é executada via endpoint interno ou via cron job agendado.
 */

import * as crypto from 'crypto';

import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Prisma } from '@nexa-oper/db';

import { ForceReconcileDto } from './dto/force-reconcile.dto';
import {
  ReconcileResponseDto,
  ReconcileStatsDto,
} from './dto/reconcile-response.dto';
import { acquireLock, releaseLock } from '../../common/utils/job-lock';
import { DatabaseService } from '../../database/database.service';

const JOB_NAME = 'reconciliacao_turnos';

@Injectable()
export class InternalReconciliacaoService {
  private readonly logger = new Logger(InternalReconciliacaoService.name);
  private readonly lockTtlMs: number;

  constructor(private readonly db: DatabaseService) {
    this.lockTtlMs = parseInt(
      process.env.RECONCILE_LOCK_TTL_MS || '900000',
      10
    ); // 15 minutos padrão
  }

  /**
   * Executa reconciliação de turnos
   *
   * @param params - Parâmetros da reconciliação
   * @param triggeredBy - Origem da execução (ex: 'cron', 'manual', 'api')
   * @returns Resultado da execução com estatísticas
   */
  async runReconciliacao(
    params: ForceReconcileDto,
    triggeredBy: string = 'manual'
  ): Promise<ReconcileResponseDto> {
    const runId = `run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const startedAt = new Date();
    const prisma = this.db.getPrisma();

    // Identificador único para o lock (hostname + PID)
    const lockedBy = `${process.env.HOSTNAME || 'unknown'}-${process.pid}-${runId}`;

    this.logger.log(
      `[${runId}] Iniciando reconciliação - triggeredBy: ${triggeredBy}, params: ${JSON.stringify(params)}`
    );

    // Tentar adquirir lock
    const lockAcquired = await acquireLock(
      prisma,
      JOB_NAME,
      this.lockTtlMs,
      lockedBy
    );
    if (!lockAcquired) {
      this.logger.warn(
        `[${runId}] Não foi possível adquirir lock - reconciliação já em execução`
      );
      throw new ConflictException('Reconciliação já está em execução');
    }

    this.logger.log(`[${runId}] Lock adquirido com sucesso`);

    const stats: ReconcileStatsDto = {
      created: 0,
      updated: 0,
      closed: 0,
      skipped: 0,
    };
    const warnings: string[] = [];

    try {
      // Normalizar parâmetros
      const dataReferencia = params.dataReferencia
        ? new Date(params.dataReferencia)
        : new Date();
      dataReferencia.setHours(0, 0, 0, 0);

      const intervaloDias = params.intervaloDias || 1;
      const equipeId = params.equipeId;
      const dryRun = params.dryRun || false;

      this.logger.log(
        `[${runId}] Parâmetros: dataReferencia=${dataReferencia.toISOString().split('T')[0]}, intervaloDias=${intervaloDias}, equipeId=${equipeId || 'todas'}, dryRun=${dryRun}`
      );

      // Se equipeId não foi informado, processar todas as equipes com escala
      if (!equipeId) {
        const resultado = await this.reconciliarTodasEquipes(
          prisma,
          dataReferencia,
          intervaloDias,
          dryRun,
          runId
        );
        stats.created += resultado.created;
        stats.updated += resultado.updated;
        stats.closed += resultado.closed;
        stats.skipped += resultado.skipped;
        warnings.push(...resultado.warnings);
      } else {
        // Processar equipe específica
        for (let dia = 0; dia < intervaloDias; dia++) {
          const dataAtual = new Date(dataReferencia);
          dataAtual.setDate(dataAtual.getDate() + dia);
          dataAtual.setHours(0, 0, 0, 0);

          const resultado = await this.reconciliarDiaEquipe(
            prisma,
            dataAtual,
            equipeId,
            dryRun,
            runId
          );
          stats.created += resultado.created;
          stats.updated += resultado.updated;
          stats.closed += resultado.closed;
          stats.skipped += resultado.skipped;
          warnings.push(...resultado.warnings);
        }
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      this.logger.log(
        `[${runId}] Reconciliação concluída - stats: ${JSON.stringify(stats)}, duration: ${durationMs}ms`
      );

      return {
        success: true,
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs,
        stats,
        warnings,
      };
    } catch (error) {
      this.logger.error(`[${runId}] Erro na reconciliação:`, error);
      throw error;
    } finally {
      // Liberar lock sempre
      await releaseLock(prisma, JOB_NAME, lockedBy);
      this.logger.log(`[${runId}] Lock liberado`);
    }
  }

  /**
   * Reconcilia todas as equipes com escala publicada
   */
  private async reconciliarTodasEquipes(
    prisma: any,
    dataReferencia: Date,
    intervaloDias: number,
    dryRun: boolean,
    runId: string
  ): Promise<ReconcileStatsDto & { warnings: string[] }> {
    const stats: ReconcileStatsDto = {
      created: 0,
      updated: 0,
      closed: 0,
      skipped: 0,
    };
    const warnings: string[] = [];

    // Buscar todas as equipes com escala publicada no período
    const dataFim = new Date(dataReferencia);
    dataFim.setDate(dataFim.getDate() + intervaloDias - 1);
    dataFim.setHours(23, 59, 59, 999);

    const equipesComEscala = await prisma.escalaEquipePeriodo.findMany({
      where: {
        periodoInicio: { lte: dataFim },
        periodoFim: { gte: dataReferencia },
        status: 'PUBLICADA',
      },
      select: {
        equipeId: true,
      },
      distinct: ['equipeId'],
    });

    this.logger.log(
      `[${runId}] Encontradas ${equipesComEscala.length} equipes com escala`
    );

    // Processar cada equipe para cada dia
    for (const escala of equipesComEscala) {
      for (let dia = 0; dia < intervaloDias; dia++) {
        const dataAtual = new Date(dataReferencia);
        dataAtual.setDate(dataAtual.getDate() + dia);
        dataAtual.setHours(0, 0, 0, 0);

        try {
          const resultado = await this.reconciliarDiaEquipe(
            prisma,
            dataAtual,
            escala.equipeId,
            dryRun,
            runId
          );
          stats.created += resultado.created;
          stats.updated += resultado.updated;
          stats.closed += resultado.closed;
          stats.skipped += resultado.skipped;
          warnings.push(...resultado.warnings);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          warnings.push(
            `Erro ao reconciliar equipe ${escala.equipeId} em ${dataAtual.toISOString().split('T')[0]}: ${errorMsg}`
          );
          this.logger.warn(
            `[${runId}] Erro ao reconciliar equipe ${escala.equipeId}:`,
            error
          );
        }
      }
    }

    return { ...stats, warnings };
  }

  /**
   * Reconcilia um dia específico para uma equipe
   *
   * Porta da lógica do WEB: apps/web/src/lib/actions/turno/reconciliarDiaEquipe.ts
   */
  private async reconciliarDiaEquipe(
    prisma: any,
    dataReferencia: Date,
    equipeId: number,
    dryRun: boolean,
    runId: string
  ): Promise<ReconcileStatsDto & { warnings: string[] }> {
    const stats: ReconcileStatsDto = {
      created: 0,
      updated: 0,
      closed: 0,
      skipped: 0,
    };
    const warnings: string[] = [];

    const dataRefInicio = new Date(dataReferencia);
    dataRefInicio.setHours(0, 0, 0, 0);
    const dataRefFim = new Date(dataReferencia);
    dataRefFim.setHours(23, 59, 59, 999);

    this.logger.debug(
      `[${runId}] Reconciliação para equipe ${equipeId} em ${dataReferencia.toISOString().split('T')[0]}`
    );

    // A lógica completa de reconciliação será portada do WEB
    // Por enquanto, retornar estrutura básica
    // TODO: Portar lógica completa de reconciliarDiaEquipeInterna do WEB

    return { ...stats, warnings };
  }
}
