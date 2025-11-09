import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import { TurnoReconciliacaoService } from './turno-reconciliacao.service';

/**
 * Serviço de Agendamento para Reconciliação de Turnos
 *
 * Executa reconciliação automática diariamente às 23h para processar
 * dias pendentes e aguardar margem de 30 minutos para turnos esperados.
 */
@Injectable()
export class TurnoReconciliacaoSchedulerService {
  private readonly logger = new Logger(TurnoReconciliacaoSchedulerService.name);

  constructor(
    private readonly turnoReconciliacaoService: TurnoReconciliacaoService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Job diário às 23h para reconciliar todos os dias pendentes
   *
   * Processa últimos 30 dias e verifica se há turnos que não foram abertos,
   * aguardando margem de 30 minutos após horário previsto.
   */
  @Cron('0 23 * * *', {
    name: 'reconciliacao-turnos-diaria',
    timeZone: 'America/Sao_Paulo',
  })
  async executarReconciliacaoDiaria(): Promise<void> {
    this.logger.log('Iniciando reconciliação diária de turnos...');
    const inicioExecucao = Date.now();

    try {
      const prisma = this.db.getPrisma();
      const agora = new Date();
      const diasParaProcessar = parseInt(
        process.env.RECONCILIACAO_DIAS_HISTORICO || '30',
        10
      );

      // Calcular período (últimos N dias)
      const dataFim = new Date(agora);
      dataFim.setHours(23, 59, 59, 999);
      const dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - diasParaProcessar);
      dataInicio.setHours(0, 0, 0, 0);

      this.logger.debug(
        `Período: ${dataInicio.toISOString().split('T')[0]} até ${dataFim.toISOString().split('T')[0]}`
      );

      // Buscar todas as equipes que têm escala ativa no período
      const equipesComEscala = await prisma.escalaEquipePeriodo.findMany({
        where: {
          periodoInicio: { lte: dataFim },
          periodoFim: { gte: dataInicio },
          status: 'PUBLICADA',
        },
        select: {
          equipeId: true,
        },
        distinct: ['equipeId'],
      });

      this.logger.debug(`Encontradas ${equipesComEscala.length} equipes com escala no período`);

      let diasProcessados = 0;
      let equipesProcessadas = 0;
      let faltasCriadas = 0;
      let horasExtrasCriadas = 0;
      let divergenciasCriadas = 0;
      const erros: Array<{ equipe: number; data: string; erro: string }> = [];

      // Processar cada equipe
      for (const escalaEquipe of equipesComEscala) {
        const equipeId = escalaEquipe.equipeId;

        // Para cada dia do período, verificar se precisa reconciliar
        const dataAtual = new Date(dataInicio);
        while (dataAtual <= dataFim) {
          const dataStr = dataAtual.toISOString().split('T')[0];

          try {
            // Verificar se há slots de escala neste dia para esta equipe
            const slotsNoDia = await prisma.slotEscala.findFirst({
              where: {
                data: {
                  gte: new Date(dataAtual.setHours(0, 0, 0, 0)),
                  lte: new Date(dataAtual.setHours(23, 59, 59, 999)),
                },
                escalaEquipePeriodo: {
                  equipeId,
                  status: 'PUBLICADA',
                },
              },
              select: { id: true },
            });

            // Se há slots, reconciliar o dia
            if (slotsNoDia) {
              // Verificar margem de 30 minutos para cada slot
              const slots = await prisma.slotEscala.findMany({
                where: {
                  data: {
                    gte: new Date(dataAtual.setHours(0, 0, 0, 0)),
                    lte: new Date(dataAtual.setHours(23, 59, 59, 999)),
                  },
                  escalaEquipePeriodo: {
                    equipeId,
                    status: 'PUBLICADA',
                  },
                  estado: 'TRABALHO',
                },
                include: {
                  eletricista: {
                    include: {
                      Status: true,
                    },
                  },
                },
              });

              // Verificar se já passou a margem de 30 minutos para cada slot
              let podeReconciliar = true;
              for (const slot of slots) {
                if (slot.inicioPrevisto) {
                  const [hora, minuto] = slot.inicioPrevisto.split(':').map(Number);
                  const horarioPrevisto = new Date(dataAtual);
                  horarioPrevisto.setHours(hora, minuto, 0, 0);

                  const horarioLimite = new Date(horarioPrevisto);
                  horarioLimite.setMinutes(horarioLimite.getMinutes() + 30);

                  // Se ainda não passou o horário limite, não reconciliar este dia ainda
                  if (agora < horarioLimite) {
                    podeReconciliar = false;
                    break;
                  }
                }
              }

              if (podeReconciliar) {
                await this.turnoReconciliacaoService.reconciliarDiaEquipe({
                  dataReferencia: dataStr,
                  equipePrevistaId: equipeId,
                  executadoPor: 'system-scheduler',
                });

                diasProcessados++;
              }
            }

            // Avançar para próximo dia
            dataAtual.setDate(dataAtual.getDate() + 1);
          } catch (error) {
            const erroMsg = error instanceof Error ? error.message : String(error);
            erros.push({
              equipe: equipeId,
              data: dataStr,
              erro: erroMsg,
            });
            this.logger.warn(
              `⚠️ Erro ao reconciliar equipe ${equipeId} em ${dataStr}: ${erroMsg}`
            );
          }
        }

        equipesProcessadas++;
      }

      const duracao = ((Date.now() - inicioExecucao) / 1000).toFixed(2);

      this.logger.log(
        `✅ Reconciliação diária concluída em ${duracao}s: ` +
          `${diasProcessados} dias processados, ${equipesProcessadas} equipes, ` +
          `${erros.length} erros`
      );

      if (erros.length > 0) {
        this.logger.warn(`Erros encontrados: ${JSON.stringify(erros)}`);
      }
    } catch (error) {
      this.logger.error(
        `Erro crítico na reconciliação diária: ${error}`,
        error instanceof Error ? error.stack : undefined
      );
      // Não lançar erro para não interromper o job
    }
  }

  /**
   * Método para executar reconciliação manual (para testes ou execução sob demanda)
   */
  async executarReconciliacaoManual(
    equipeId: number,
    dataReferencia: string
  ): Promise<void> {
    this.logger.log(
      `Executando reconciliação manual para equipe ${equipeId} em ${dataReferencia}`
    );

    await this.turnoReconciliacaoService.reconciliarDiaEquipe({
      dataReferencia,
      equipePrevistaId: equipeId,
      executadoPor: 'system-manual',
    });
  }
}

