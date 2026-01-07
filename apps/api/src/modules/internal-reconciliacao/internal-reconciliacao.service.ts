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
import {
  getSaoPauloDayRange,
  parseDateInput,
} from '../../common/utils/date-timezone';
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
      const dataReferenciaBase = params.dataReferencia
        ? parseDateInput(params.dataReferencia)
        : new Date();
      const { start: dataReferencia } =
        getSaoPauloDayRange(dataReferenciaBase);

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
          dataAtual.setUTCDate(dataAtual.getUTCDate() + dia);

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

      const result = {
        success: true,
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs,
        stats,
        warnings,
      };

      return result;
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
    const dataRefLabel = dataReferencia.toISOString().split('T')[0];
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

    this.logger.log(
      `[${runId}] Procurando equipes com escala publicada entre ${dataRefLabel} e ${dataFim.toISOString().split('T')[0]}`
    );

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
        dataAtual.setUTCDate(dataAtual.getUTCDate() + dia);
        const dataAtualLabel = dataAtual.toISOString().split('T')[0];

        try {
          this.logger.log(
            `[${runId}] Iniciando reconciliação da equipe ${escala.equipeId} no dia ${dataAtualLabel}`
          );
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
    const dataRefLabel = dataReferencia.toISOString().split('T')[0];
    const stats: ReconcileStatsDto = {
      created: 0,
      updated: 0,
      closed: 0,
      skipped: 0,
    };
    const warnings: string[] = [];

    const { start: dataRefInicio, end: dataRefFim } =
      getSaoPauloDayRange(dataReferencia);

    this.logger.log(
      `[${runId}] Procurando escala do dia ${dataRefLabel} para equipe ${equipeId}`
    );
    this.logger.debug(
      `[${runId}] Intervalo SP: ${dataRefInicio.toISOString()} -> ${dataRefFim.toISOString()}`
    );

    if (dryRun) {
      this.logger.log(`[${runId}] DRY RUN - nenhuma alteração será feita`);
      return { ...stats, warnings };
    }

    try {
      // 1. Buscar slots da escala (previstos) com estado e horários
      const slots = await prisma.slotEscala.findMany({
        where: {
          data: {
            gte: dataRefInicio,
            lte: dataRefFim,
          },
          escalaEquipePeriodo: { equipeId: equipeId },
        },
        include: {
          eletricista: {
            include: {
              Status: true,
            },
          },
        },
      });

      this.logger.log(
        `[${runId}] Slots previstos encontrados: ${slots.length} (equipe ${equipeId}, dia ${dataRefLabel})`
      );

      // 1b. Buscar TODOS os slots do dia (de todas as equipes) para verificar se eletricista tinha escala
      const todosSlotsDia = await prisma.slotEscala.findMany({
        where: {
          data: {
            gte: dataRefInicio,
            lte: dataRefFim,
          },
          escalaEquipePeriodo: {
            status: 'PUBLICADA',
          },
        },
        select: {
          eletricistaId: true,
        },
      });

      this.logger.log(
        `[${runId}] Slots totais do dia ${dataRefLabel} (todas equipes): ${todosSlotsDia.length}`
      );

      const eletricistasComEscala = new Set(
        todosSlotsDia.map((s: { eletricistaId: number }) => s.eletricistaId)
      );

      // 2. Buscar turnos realmente abertos no dia (todas as equipes)
      this.logger.log(
        `[${runId}] Procurando turnos realizados/abertos no dia ${dataRefLabel} (todas equipes)`
      );
      const aberturasDia = await prisma.turnoRealizadoEletricista.findMany({
        where: {
          turnoRealizado: {
            dataReferencia: {
              gte: dataRefInicio,
              lte: dataRefFim,
            },
          },
        },
        include: {
          turnoRealizado: {
            select: {
              equipeId: true,
            },
          },
          eletricista: {
            include: {
              Status: true,
            },
          },
        },
      });

      this.logger.log(
        `[${runId}] Turnos realizados/aberturas encontrados: ${aberturasDia.length} (dia ${dataRefLabel})`
      );

      // 3. Agrupar aberturas por eletricista e equipe
      const abertosPorEletricista = new Map<
        number,
        {
          equipes: Set<number>;
          itens: typeof aberturasDia;
        }
      >();

      for (const abertura of aberturasDia) {
        const eletricistaId = abertura.eletricistaId;
        const existing = abertosPorEletricista.get(eletricistaId);
        if (existing) {
          existing.equipes.add(abertura.turnoRealizado.equipeId);
          existing.itens.push(abertura);
        } else {
          abertosPorEletricista.set(eletricistaId, {
            equipes: new Set([abertura.turnoRealizado.equipeId]),
            itens: [abertura],
          });
        }
      }

      this.logger.debug(
        `[${runId}] Eletricistas com turno aberto no dia ${dataRefLabel}: ${abertosPorEletricista.size}`
      );

      // 4. Processar cada slot da escala
      for (const slot of slots) {
        const aberturasEletricista = abertosPorEletricista.get(slot.eletricistaId);
        const estadoSlot = slot.estado;
        const eletricistaStatus = slot.eletricista.Status?.status || 'ATIVO';
        const eletricistaNome = slot.eletricista?.nome || 'sem_nome';
        const eletricistaMatricula = slot.eletricista?.matricula || 'sem_matricula';
        const equipesAbertas = aberturasEletricista
          ? [...aberturasEletricista.equipes]
          : [];

        this.logger.debug(
          `[${runId}] Slot previsto: dia ${dataRefLabel}, equipe ${equipeId}, slotId=${slot.id}, eletricista=${slot.eletricistaId} (${eletricistaNome}, ${eletricistaMatricula}), estado=${estadoSlot}, statusEletricista=${eletricistaStatus}, equipesAbertas=${equipesAbertas.join(',') || 'nenhuma'}`
        );

        const statusJustificaFalta = [
          'FERIAS',
          'LICENCA_MEDICA',
          'LICENCA_MATERNIDADE',
          'LICENCA_PATERNIDADE',
          'SUSPENSAO',
          'TREINAMENTO',
          'AFastADO',
          'DESLIGADO',
          'APOSENTADO',
        ].includes(eletricistaStatus);

        // CASO 1: TRABALHO + ABRIU na mesma equipe (Normal)
        if (estadoSlot === 'TRABALHO') {
          if (
            aberturasEletricista &&
            aberturasEletricista.equipes.has(equipeId)
          ) {
            // Caso normal, sem ação adicional
            this.logger.debug(
              `[${runId}] OK: previsto e turno aberto na equipe ${equipeId} (eletricista ${slot.eletricistaId})`
            );
            continue;
          }

          // CASO 2: TRABALHO + NÃO ABRIU na equipe prevista
          if (!aberturasEletricista || !aberturasEletricista.equipes.has(equipeId)) {
            // CASO 3: TRABALHO + ABRIU em EQUIPE DIFERENTE (Divergência)
            if (aberturasEletricista && aberturasEletricista.equipes.size > 0) {
              const equipeRealId = [...aberturasEletricista.equipes][0];
              this.logger.log(
                `[${runId}] Divergencia: previsto equipe ${equipeId}, abriu na equipe ${equipeRealId} (eletricista ${slot.eletricistaId})`
              );
              try {
                await prisma.divergenciaEscala.upsert({
                  where: {
                    dataReferencia_eletricistaId_equipePrevistaId_equipeRealId: {
                      dataReferencia: dataReferencia,
                      eletricistaId: slot.eletricistaId,
                      equipePrevistaId: equipeId,
                      equipeRealId,
                    },
                  },
                  update: {},
                  create: {
                    dataReferencia: dataReferencia,
                    equipePrevistaId: equipeId,
                    equipeRealId,
                    eletricistaId: slot.eletricistaId,
                    tipo: 'equipe_divergente',
                    detalhe: null,
                    createdBy: 'system',
                  },
                });
                stats.created++;
                this.logger.debug(
                  `[${runId}] Divergencia registrada (eletricista ${slot.eletricistaId})`
                );
              } catch (err: any) {
                if (err.code !== 'P2002') {
                  warnings.push(`Erro ao criar divergência para eletricista ${slot.eletricistaId}: ${err.message}`);
                }
              }
              continue;
            }

            // CASO 2: TRABALHO + NÃO ABRIU em NENHUMA equipe (Falta)
            this.logger.log(
              `[${runId}] Nao achou turno aberto na equipe ${equipeId} (eletricista ${slot.eletricistaId})`
            );
            const justificativaEquipe = await prisma.justificativaEquipe.findUnique({
              where: {
                dataReferencia_equipeId: {
                  dataReferencia: dataReferencia,
                  equipeId: equipeId,
                },
              },
              include: {
                tipoJustificativa: true,
              },
            });

            if (
              justificativaEquipe &&
              justificativaEquipe.status === 'aprovada' &&
              !justificativaEquipe.tipoJustificativa.geraFalta
            ) {
              this.logger.debug(
                `[${runId}] Justificativa aprovada sem falta para equipe ${equipeId} no dia ${dataRefLabel}`
              );
              continue;
            }

            if (!statusJustificaFalta) {
              try {
                const faltaResult = await prisma.falta.upsert({
                  where: {
                    dataReferencia_equipeId_eletricistaId_motivoSistema: {
                      dataReferencia: dataReferencia,
                      equipeId: equipeId,
                      eletricistaId: slot.eletricistaId,
                      motivoSistema: 'falta_abertura',
                    },
                  },
                  update: {},
                  create: {
                    dataReferencia: dataReferencia,
                    equipeId: equipeId,
                    eletricistaId: slot.eletricistaId,
                    escalaSlotId: slot.id,
                    motivoSistema: 'falta_abertura',
                    status: 'pendente',
                    createdBy: 'system',
                  },
                });
                stats.created++;
                this.logger.log(
                  `[${runId}] Falta registrada (eletricista ${slot.eletricistaId}, equipe ${equipeId}, dia ${dataRefLabel})`
                );
              } catch (err: any) {
                if (err.code !== 'P2002') {
                  warnings.push(`Erro ao criar falta para eletricista ${slot.eletricistaId}: ${err.message}`);
                }
              }
            } else {
              this.logger.debug(
                `[${runId}] Status do eletricista justifica falta (status=${eletricistaStatus}), sem registrar falta`
              );
            }
            continue;
          }
        }

        // CASO 4: FOLGA + ABRIU (Hora Extra - folga_trabalhada)
        if (estadoSlot === 'FOLGA') {
          if (aberturasEletricista && aberturasEletricista.itens.length > 0) {
            const abertura =
              aberturasEletricista.itens.find(
                (a: any) => a.turnoRealizado.equipeId === equipeId
              ) || aberturasEletricista.itens[0];

            this.logger.log(
              `[${runId}] Folga trabalhada detectada (eletricista ${slot.eletricistaId}, abertura ${abertura.id}, equipe ${abertura.turnoRealizado.equipeId})`
            );
            const jaExiste = await prisma.horaExtra.findFirst({
              where: {
                turnoRealizadoEletricistaId: abertura.id,
                tipo: 'folga_trabalhada',
              },
            });

            if (!jaExiste) {
              const horasRealizadas = this.calcularHorasTrabalhadas(
                abertura.abertoEm,
                abertura.fechadoEm
              );

              try {
                await prisma.horaExtra.create({
                  data: {
                    dataReferencia: dataReferencia,
                    eletricistaId: slot.eletricistaId,
                    turnoRealizadoEletricistaId: abertura.id,
                    escalaSlotId: slot.id,
                    tipo: 'folga_trabalhada',
                    horasPrevistas: new Prisma.Decimal(0),
                    horasRealizadas: new Prisma.Decimal(horasRealizadas),
                    diferencaHoras: new Prisma.Decimal(horasRealizadas),
                    status: 'pendente',
                    createdBy: 'system',
                  },
                });
                stats.created++;
                this.logger.log(
                  `[${runId}] Hora extra (folga_trabalhada) criada - horas=${horasRealizadas.toFixed(2)} (eletricista ${slot.eletricistaId})`
                );
              } catch (err: any) {
                if (err.code !== 'P2002') {
                  warnings.push(`Erro ao criar hora extra (folga_trabalhada) para eletricista ${slot.eletricistaId}: ${err.message}`);
                }
              }
            } else {
              this.logger.debug(
                `[${runId}] Hora extra (folga_trabalhada) ja existente para abertura ${abertura.id}`
              );
            }
          }
        }

        // CASO 6: EXCECAO ou outros estados
        if (estadoSlot === 'EXCECAO' || estadoSlot === 'FALTA') {
          if (
            !aberturasEletricista ||
            aberturasEletricista.equipes.size === 0
          ) {
            this.logger.log(
              `[${runId}] Estado ${estadoSlot} sem turno aberto (eletricista ${slot.eletricistaId}, equipe ${equipeId})`
            );
            if (!statusJustificaFalta) {
              try {
                await prisma.falta.upsert({
                  where: {
                    dataReferencia_equipeId_eletricistaId_motivoSistema: {
                      dataReferencia: dataReferencia,
                      equipeId: equipeId,
                      eletricistaId: slot.eletricistaId,
                      motivoSistema: 'falta_abertura',
                    },
                  },
                  update: {},
                  create: {
                    dataReferencia: dataReferencia,
                    equipeId: equipeId,
                    eletricistaId: slot.eletricistaId,
                    escalaSlotId: slot.id,
                    motivoSistema: 'falta_abertura',
                    status: 'pendente',
                    createdBy: 'system',
                  },
                });
                stats.created++;
                this.logger.log(
                  `[${runId}] Falta registrada (estado ${estadoSlot}) para eletricista ${slot.eletricistaId}`
                );
              } catch (err: any) {
                if (err.code !== 'P2002') {
                  // Ignorar erros silenciosamente
                }
              }
            } else {
              this.logger.debug(
                `[${runId}] Status do eletricista justifica falta (status=${eletricistaStatus}) em estado ${estadoSlot}`
              );
            }
          }
        }
      }

      // 5. Processar turnos abertos SEM escala (CASO 6: extrafora)
      for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
        const tinhaSlotNaEscala = eletricistasComEscala.has(eletricistaId);

        if (!tinhaSlotNaEscala) {
          this.logger.log(
            `[${runId}] Turno aberto sem escala prevista (extrafora) para eletricista ${eletricistaId} no dia ${dataRefLabel}`
          );
          for (const abertura of aberturas.itens) {
            this.logger.debug(
              `[${runId}] Avaliando abertura ${abertura.id} (equipe ${abertura.turnoRealizado.equipeId}) para extrafora`
            );
            const jaExiste = await prisma.horaExtra.findFirst({
              where: {
                turnoRealizadoEletricistaId: abertura.id,
                tipo: 'extrafora',
              },
            });

            if (!jaExiste) {
              const horasRealizadas = this.calcularHorasTrabalhadas(
                abertura.abertoEm,
                abertura.fechadoEm
              );

              try {
                await prisma.horaExtra.create({
                  data: {
                    dataReferencia: dataReferencia,
                    eletricistaId,
                    turnoRealizadoEletricistaId: abertura.id,
                    tipo: 'extrafora',
                    horasPrevistas: new Prisma.Decimal(0),
                    horasRealizadas: new Prisma.Decimal(horasRealizadas),
                    diferencaHoras: new Prisma.Decimal(horasRealizadas),
                    status: 'pendente',
                    createdBy: 'system',
                  },
                });
                stats.created++;
                this.logger.log(
                  `[${runId}] Hora extra (extrafora) criada - horas=${horasRealizadas.toFixed(2)} (eletricista ${eletricistaId})`
                );
              } catch (err: any) {
                if (err.code !== 'P2002') {
                  warnings.push(`Erro ao criar hora extra (extrafora) para eletricista ${eletricistaId}: ${err.message}`);
                }
              }
            } else {
              this.logger.debug(
                `[${runId}] Hora extra (extrafora) ja existente para abertura ${abertura.id}`
              );
            }
          }
        }
      }

      this.logger.log(
        `[${runId}] Reconciliação concluída para equipe ${equipeId} em ${dataRefLabel} - stats=${JSON.stringify(stats)}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      warnings.push(`Erro ao reconciliar equipe ${equipeId}: ${errorMsg}`);
      this.logger.error(`[${runId}] Erro na reconciliação:`, error);
    }

    return { ...stats, warnings };
  }

  /**
   * Calcula horas trabalhadas a partir de abertura e fechamento
   */
  private calcularHorasTrabalhadas(
    abertoEm: Date,
    fechadoEm: Date | null
  ): number {
    if (!fechadoEm) {
      const agora = new Date();
      const diferencaMs = agora.getTime() - abertoEm.getTime();
      return diferencaMs / (1000 * 60 * 60);
    }

    const diferencaMs = fechadoEm.getTime() - abertoEm.getTime();
    return diferencaMs / (1000 * 60 * 60);
  }
}
