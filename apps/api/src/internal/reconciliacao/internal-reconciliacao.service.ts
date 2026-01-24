/**
 * Serviço de Reconciliação Interna de Turnos
 *
 * Este serviço implementa a lógica de reconciliação de turnos, comparando
 * turnos realizados com escala planejada e gerando faltas, divergências e horas extras.
 *
 * A reconciliação é executada via endpoint interno ou via cron job agendado.
 */

import * as crypto from 'crypto';

import {
  getSaoPauloDayRange,
  parseDateInput,
} from '@common/utils/date-timezone';
import { acquireLock, releaseLock } from '@common/utils/job-lock';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@nexa-oper/db';

import { ForceReconcileDto } from './dto/force-reconcile.dto';
import {
  ReconcileResponseDto,
  ReconcileStatsDto,
} from './dto/reconcile-response.dto';
import {
  buscarSlotsEscala,
  buscarTodosSlotsDia,
  buscarAberturasDia,
} from './reconciliacao-db';
import {
  processarInteracaoSlot,
  processarExtrafora,
} from './reconciliacao-processor';
import { agruparAberturasPorEletricista } from './reconciliacao.utils';
import {
  SlotComEletricista,
  AberturaTurno,
  AberturasPorEletricistaMap,
} from './types';

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
   */
  async runReconciliacao(
    params: ForceReconcileDto,
    triggeredBy: string = 'manual'
  ): Promise<ReconcileResponseDto> {
    const runId = `run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const startedAt = new Date();
    // Obtém o client do Prisma (pode ser usado como TransactionClient se necessário passar adiante)
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
    let errorOccurred: any = null;

    try {
      await this.executeReconciliationLogic(
        prisma,
        params,
        runId,
        stats,
        warnings
      );

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
      errorOccurred = error;
      this.logger.error(`[${runId}] Erro na reconciliação:`, error);
      throw error;
    } finally {
      // Registrar log de execução no banco (separado)
      await this.registrarLogExecucao(
        runId,
        triggeredBy,
        stats,
        warnings,
        startedAt,
        errorOccurred
      );

      // Liberar lock sempre
      await releaseLock(prisma, JOB_NAME, lockedBy);
      this.logger.log(`[${runId}] Lock liberado`);
    }
  }

  private async registrarLogExecucao(
    runId: string,
    triggeredBy: string,
    stats: ReconcileStatsDto,
    warnings: string[],
    startedAt: Date,
    errorOccurred: any
  ) {
    try {
      const finalStatus = errorOccurred
        ? 'ERROR'
        : warnings.length > 0
          ? 'WARNING'
          : stats.created > 0
            ? 'SUCCESS_CHANGES'
            : 'SUCCESS';

      const durationMs = new Date().getTime() - startedAt.getTime();
      const logEntry = `
================================================================================
[${new Date().toISOString()}] RECONCILIACAO FINISHED
RunID: ${runId}
Trigger: ${triggeredBy}
Status: ${finalStatus}
Duration: ${durationMs}ms
Stats: Created=${stats.created}, Updated=${stats.updated}, Closed=${stats.closed}, Skipped=${stats.skipped}
Error: ${errorOccurred ? errorOccurred.message || errorOccurred : 'None'}
Warnings: ${warnings.length > 0 ? '\n' + warnings.map(w => ' - ' + w).join('\n') : 'None'}
================================================================================
`;
      const fs = await import('fs');
      const path = await import('path');
      const logDir = path.resolve(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(path.join(logDir, 'reconciliacao.log'), logEntry);
    } catch (logErr) {
      this.logger.warn(
        `Falha ao salvar arquivo de log de reconciliação: ${logErr}`
      );
    }
  }

  /**
   * Reconcilia um intervalo de dias (para uma equipe ou todas)
   */
  private async executeReconciliationLogic(
    prisma: PrismaClient | Prisma.TransactionClient,
    params: ForceReconcileDto,
    runId: string,
    stats: ReconcileStatsDto,
    warnings: string[]
  ) {
    const dataReferenciaBase = params.dataReferencia
      ? parseDateInput(params.dataReferencia)
      : new Date();
    const { start: dataReferenciaInicial } =
      getSaoPauloDayRange(dataReferenciaBase);

    const intervaloDias = params.intervaloDias || 1;
    const equipeId = params.equipeId; // Pode ser undefined (todas)
    const dryRun = params.dryRun || false;

    this.logger.log(
      `[${runId}] Executando reconciliação: DataInicio=${dataReferenciaInicial.toISOString().split('T')[0]}, Dias=${intervaloDias}, Equipe=${equipeId || 'TODAS'}, DryRun=${dryRun}`
    );

    // Itera por dia (abordagem Day-Centric para evitar N+1 queries)
    for (let i = 0; i < intervaloDias; i++) {
      const dataAtual = new Date(dataReferenciaInicial);
      dataAtual.setUTCDate(dataAtual.getUTCDate() + i);

      await this.reconciliarDia(
        prisma,
        dataAtual,
        equipeId,
        dryRun,
        runId,
        stats,
        warnings
      );
    }
  }

  /**
   * Reconciliação otimizada para um único dia.
   * Busca dados em batch e processa em memória.
   */
  private async reconciliarDia(
    prisma: PrismaClient | Prisma.TransactionClient,
    dataReferencia: Date,
    filtroEquipeId: number | undefined,
    dryRun: boolean,
    runId: string,
    stats: ReconcileStatsDto,
    warnings: string[]
  ) {
    const dataRefLabel = dataReferencia.toISOString().split('T')[0];
    const { start: dataRefInicio, end: dataRefFim } =
      getSaoPauloDayRange(dataReferencia);

    this.logger.debug(
      `[${runId}] Processando dia ${dataRefLabel} (Equipe: ${filtroEquipeId || 'Todas'})...`
    );

    if (dryRun) {
      this.logger.log(`[${runId}] DRY RUN - Dia ${dataRefLabel} ignorado.`);
      return;
    }

    try {
      const {
        eletricistasComEscalaGlobalSet,
        slotsAProcessar,
        todasAberturasDia,
      } = await this.buscarDadosReconciliacao(
        prisma,
        dataRefInicio,
        dataRefFim,
        filtroEquipeId
      );

      const mapAberturasGlobal =
        agruparAberturasPorEletricista(todasAberturasDia);

      const slotsProcessadosCount = await this.processarSlotsDia(
        prisma,
        slotsAProcessar,
        mapAberturasGlobal,
        dataReferencia,
        runId,
        stats,
        warnings
      );

      const aberturasExtraForaCount = await this.processarExtrasForaDia(
        prisma,
        todasAberturasDia,
        eletricistasComEscalaGlobalSet,
        dataReferencia,
        dataRefLabel,
        filtroEquipeId,
        runId,
        stats,
        warnings
      );

      this.logger.log(
        `[${runId}] Dia ${dataRefLabel} concluído. Slots: ${slotsProcessadosCount}, AberturasScan: ${aberturasExtraForaCount}.`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      warnings.push(`Erro crítico no dia ${dataRefLabel}: ${errorMsg}`);
      this.logger.error(
        `[${runId}] Erro ao processar dia ${dataRefLabel}:`,
        error
      );
    }
  }

  private async buscarDadosReconciliacao(
    prisma: PrismaClient | Prisma.TransactionClient,
    dataRefInicio: Date,
    dataRefFim: Date,
    filtroEquipeId: number | undefined
  ) {
    const [todosSlotsDiaGlobal, slotsAProcessar, todasAberturasDia] =
      await Promise.all([
        buscarTodosSlotsDia(prisma, dataRefInicio, dataRefFim),
        buscarSlotsEscala(prisma, dataRefInicio, dataRefFim, filtroEquipeId),
        buscarAberturasDia(prisma, dataRefInicio, dataRefFim),
      ]);

    const eletricistasComEscalaGlobalSet = new Set(
      todosSlotsDiaGlobal.map(s => s.eletricistaId)
    );

    return {
      eletricistasComEscalaGlobalSet,
      slotsAProcessar,
      todasAberturasDia,
    };
  }

  private async processarSlotsDia(
    prisma: PrismaClient | Prisma.TransactionClient,
    slotsAProcessar: SlotComEletricista[],
    mapAberturasGlobal: AberturasPorEletricistaMap,
    dataReferencia: Date,
    runId: string,
    stats: ReconcileStatsDto,
    warnings: string[]
  ): Promise<number> {
    let slotsProcessadosCount = 0;
    for (const slot of slotsAProcessar) {
      await processarInteracaoSlot(
        prisma,
        slot,
        mapAberturasGlobal,
        slot.escalaEquipePeriodo.equipeId,
        dataReferencia,
        runId,
        stats,
        warnings
      );
      slotsProcessadosCount++;
    }
    return slotsProcessadosCount;
  }

  private async processarExtrasForaDia(
    prisma: PrismaClient | Prisma.TransactionClient,
    todasAberturasDia: AberturaTurno[],
    eletricistasComEscalaGlobalSet: Set<number>,
    dataReferencia: Date,
    dataRefLabel: string,
    filtroEquipeId: number | undefined,
    runId: string,
    stats: ReconcileStatsDto,
    warnings: string[]
  ): Promise<number> {
    let aberturasExtraForaCandidatas = todasAberturasDia;

    if (filtroEquipeId) {
      aberturasExtraForaCandidatas = todasAberturasDia.filter(
        a => a.turnoRealizado.equipeId === filtroEquipeId
      );
    }

    const mapAberturasCandidatas = agruparAberturasPorEletricista(
      aberturasExtraForaCandidatas
    );

    await processarExtrafora(
      prisma,
      mapAberturasCandidatas,
      eletricistasComEscalaGlobalSet,
      dataReferencia,
      dataRefLabel,
      runId,
      stats,
      warnings
    );

    return aberturasExtraForaCandidatas.length;
  }
}
