/**
 * Serviço de Tarefas Agendadas (Scheduler)
 *
 * Gerencia jobs agendados usando node-cron.
 * Inicializado automaticamente no instrumentation.ts
 */

import * as cron from 'node-cron';
import { gerarSnapshotAderencia } from '../actions/turno/gerarSnapshotAderencia';
// import { executarReconciliacaoDiaria } from '../actions/turno/executarReconciliacaoDiaria'; // DESATIVADO: Reconciliação agora roda na API

class SchedulerService {
  private jobs: cron.ScheduledTask[] = [];
  private initialized = false;

  /**
   * Inicializa todos os jobs agendados
   * Deve ser chamado apenas no servidor (não no cliente)
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('[Scheduler] Já inicializado, ignorando...');
      return;
    }

    if (typeof window !== 'undefined') {
      console.warn('[Scheduler] Tentativa de inicializar no cliente, ignorando...');
      return;
    }

    console.log('[Scheduler] Inicializando jobs agendados...');

    // Job às 12h: Snapshot parcial (até meio-dia)
    const jobMeioDia = cron.schedule(
      '0 12 * * *', // 12:00 todos os dias
      async () => {
        console.log('[Scheduler] Executando snapshot parcial (meio-dia)...');
        try {
          const resultado = await gerarSnapshotAderencia({
            geradoPor: 'sistema-cron-12h',
            horarioLimite: '12:00:00',
          });
          console.log(
            `[Scheduler] Snapshot parcial concluído - Total: ${resultado.data?.totalGerados || 0}`
          );
        } catch (error) {
          console.error('[Scheduler] Erro ao executar snapshot parcial:', error);
        }
      },
      {
        timezone: 'America/Sao_Paulo',
      }
    );

    // Job às 23:59: Snapshot final do dia
    const jobFinalDia = cron.schedule(
      '59 23 * * *', // 23:59 todos os dias
      async () => {
        console.log('[Scheduler] Executando snapshot final (fim do dia)...');
        try {
          const resultado = await gerarSnapshotAderencia({
            geradoPor: 'sistema-cron-23h59',
            // Sem horarioLimite = considera todo o dia
          });
          console.log(
            `[Scheduler] Snapshot final concluído - Total: ${resultado.data?.totalGerados || 0}`
          );
        } catch (error) {
          console.error('[Scheduler] Erro ao executar snapshot final:', error);
        }
      },
      {
        timezone: 'America/Sao_Paulo',
      }
    );

    // Job às 23h: Reconciliação diária de turnos
    // DESATIVADO: Reconciliação agora roda na API
    // const jobReconciliacao = cron.schedule(
    //   '0 23 * * *', // 23:00 todos os dias
    //   async () => {
    //     console.log('[Scheduler] Executando reconciliação diária de turnos...');
    //     try {
    //       const resultado = await executarReconciliacaoDiaria();
    //       console.log(
    //         `[Scheduler] Reconciliação diária concluída - ${resultado.diasProcessados} dias processados, ${resultado.equipesProcessadas} equipes, ${resultado.erros.length} erros`
    //       );
    //     } catch (error) {
    //       console.error('[Scheduler] Erro ao executar reconciliação diária:', error);
    //     }
    //   },
    //   {
    //     timezone: 'America/Sao_Paulo',
    //   }
    // );

    this.jobs.push(jobMeioDia, jobFinalDia);
    this.initialized = true;

    console.log(`[Scheduler] ${this.jobs.length} jobs agendados e ativos`);
  }

  /**
   * Para todos os jobs agendados
   * Útil para graceful shutdown
   */
  stop(): void {
    console.log('[Scheduler] Parando jobs agendados...');
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    this.initialized = false;
    console.log('[Scheduler] Todos os jobs foram parados');
  }

  /**
   * Retorna status dos jobs
   */
  getStatus(): { initialized: boolean; jobsCount: number } {
    return {
      initialized: this.initialized,
      jobsCount: this.jobs.length,
    };
  }
}

// Singleton
export const schedulerService = new SchedulerService();

