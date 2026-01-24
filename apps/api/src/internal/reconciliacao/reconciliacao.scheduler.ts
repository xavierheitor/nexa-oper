/**
 * Scheduler de Reconciliação de Turnos
 *
 * Executa reconciliação automática de turnos via cron job agendado.
 * Usa lock distribuído para garantir execução única mesmo com múltiplas instâncias.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ForceReconcileDto } from './dto/force-reconcile.dto';
import { InternalReconciliacaoService } from './internal-reconciliacao.service';

@Injectable()
export class ReconciliacaoScheduler {
  private readonly logger = new Logger(ReconciliacaoScheduler.name);

  constructor(
    private readonly reconciliacaoService: InternalReconciliacaoService
  ) {}

  /**
   * Executa reconciliação diária de turnos
   *
   * Cron configurável via env: RECONCILE_CRON (padrão: '0 23 * * *' = 23:00 diariamente)
   * Timezone: America/Sao_Paulo
   */
  @Cron(process.env.RECONCILE_CRON || '0 23 * * *', {
    name: 'reconciliacao-turnos-diaria',
    timeZone: 'America/Sao_Paulo',
  })
  async executarReconciliacaoDiaria(): Promise<void> {
    this.logger.log('Iniciando reconciliação diária automática...');
    await this.sendAgentLog('executarReconciliacaoDiaria ENTRY (CRON)', {
      timestamp: new Date().toISOString(),
    });

    try {
      const params = this.buildCronReconcileParams();
      const resultado = await this.reconciliacaoService.runReconciliacao(
        params,
        'cron'
      );

      await this.sendAgentLog('executarReconciliacaoDiaria EXIT (CRON)', {
        resultado,
      });

      this.logResultado(resultado);
    } catch (error) {
      if (this.isAlreadyRunningError(error)) {
        this.logger.debug(
          'Reconciliação já está em execução em outra instância'
        );
        return;
      }
      this.logger.error('Erro ao executar reconciliação diária:', error);
    }
  }

  private buildCronReconcileParams(): ForceReconcileDto {
    return {
      dataReferencia: undefined,
      equipeId: undefined,
      intervaloDias: parseInt(
        process.env.RECONCILIACAO_DIAS_HISTORICO || '30',
        10
      ),
      dryRun: false,
    };
  }

  private logResultado(resultado: {
    runId: string;
    stats: object;
    durationMs: number;
    warnings: string[];
  }): void {
    this.logger.log(
      `Reconciliação diária concluída - runId: ${resultado.runId}, ` +
        `stats: ${JSON.stringify(resultado.stats)}, ` +
        `duration: ${resultado.durationMs}ms`
    );
    if (resultado.warnings.length > 0) {
      this.logger.warn(
        `Reconciliação diária gerou ${resultado.warnings.length} avisos:`,
        resultado.warnings
      );
    }
  }

  private isAlreadyRunningError(error: unknown): boolean {
    return (
      error instanceof Error && error.message.includes('já está em execução')
    );
  }

  private async sendAgentLog(message: string, data: object): Promise<void> {
    try {
      await fetch(
        'http://127.0.0.1:7242/ingest/7c28805d-18e5-4a0d-bd0c-9f591d50615f',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'ReconciliacaoScheduler.executarReconciliacaoDiaria',
            message,
            data,
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'cron-auto',
            hypothesisId: 'A',
          }),
        }
      );
    } catch (e) {
      this.logger.warn('Erro ao enviar log do cron:', e);
    }
  }
}
