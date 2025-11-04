import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '@nexa-oper/db';

export interface ReconciliarParams {
  dataReferencia: string; // ISO date
  equipePrevistaId: number;
  executadoPor: string;
}

/**
 * Serviço de Reconciliação de Turnos
 *
 * Compara turnos realizados com escala planejada e gera:
 * - Faltas (quando escalado não abriu)
 * - Divergências (quando abriu em equipe diferente)
 * - Horas Extras (quando trabalhou em folga, extrafora, ou compensou atraso)
 */
@Injectable()
export class TurnoReconciliacaoService {
  private readonly logger = new Logger(TurnoReconciliacaoService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Reconcilia turnos de uma equipe em um dia específico
   * Idempotente por chaves únicas nas tabelas
   */
  async reconciliarDiaEquipe(params: ReconciliarParams): Promise<void> {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(params.dataReferencia);
    const dataRefInicio = new Date(dataRef);
    dataRefInicio.setHours(0, 0, 0, 0);
    const dataRefFim = new Date(dataRef);
    dataRefFim.setHours(23, 59, 59, 999);

    this.logger.log(
      `Iniciando reconciliação para equipe ${params.equipePrevistaId} em ${params.dataReferencia}`
    );

    try {
      // 1. Buscar slots da escala (previstos) com estado e horários
      const slots = await prisma.slotEscala.findMany({
        where: {
          data: {
            gte: dataRefInicio,
            lte: dataRefFim,
          },
          escalaEquipePeriodo: { equipeId: params.equipePrevistaId },
        },
        include: {
          eletricista: {
            include: {
              Status: true, // Status atual do eletricista
            },
          },
        },
      });

      // 2. Buscar turnos realmente abertos no dia (todas as equipes)
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

      // 4. Processar cada slot da escala
      for (const slot of slots) {
        const aberturasEletricista = abertosPorEletricista.get(slot.eletricistaId);
        const estadoSlot = slot.estado;
        const eletricistaStatus = slot.eletricista.Status?.status || 'ATIVO';

        // Verificar se eletricista está em situação que justifica falta
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
            aberturasEletricista.equipes.has(params.equipePrevistaId)
          ) {
            // Verificar atraso (Caso 7)
            const aberturaNaEquipe = aberturasEletricista.itens.find(
              (a) => a.turnoRealizado.equipeId === params.equipePrevistaId
            );

            if (aberturaNaEquipe && slot.inicioPrevisto) {
              await this.processarAtraso(
                prisma,
                slot,
                aberturaNaEquipe,
                params.executadoPor
              );
            }
            // Caso normal, sem ação adicional
            continue;
          }

          // CASO 2: TRABALHO + NÃO ABRIU (Falta)
          if (!aberturasEletricista || aberturasEletricista.equipes.size === 0) {
            // Não criar falta se status do eletricista justifica ausência
            if (!statusJustificaFalta) {
              await prisma.falta
                .create({
                  data: {
                    dataReferencia: dataRef,
                    equipeId: params.equipePrevistaId,
                    eletricistaId: slot.eletricistaId,
                    escalaSlotId: slot.id,
                    motivoSistema: 'falta_abertura',
                    status: 'pendente',
                    createdBy: 'system',
                  },
                })
                .catch((err: any) => {
                  // Ignorar erro de duplicata (idempotência)
                  if (err.code !== 'P2002') {
                    this.logger.warn(
                      `Erro ao criar falta para eletricista ${slot.eletricistaId}: ${err.message}`
                    );
                  }
                });
            }
            continue;
          }

          // CASO 3: TRABALHO + ABRIU em EQUIPE DIFERENTE (Divergência)
          if (!aberturasEletricista.equipes.has(params.equipePrevistaId)) {
            const equipeRealId = [...aberturasEletricista.equipes][0];
            await prisma.divergenciaEscala
              .create({
                data: {
                  dataReferencia: dataRef,
                  equipePrevistaId: params.equipePrevistaId,
                  equipeRealId,
                  eletricistaId: slot.eletricistaId,
                  tipo: 'equipe_divergente',
                  detalhe: null,
                  createdBy: params.executadoPor,
                },
              })
              .catch((err: any) => {
                if (err.code !== 'P2002') {
                  this.logger.warn(
                    `Erro ao criar divergência para eletricista ${slot.eletricistaId}: ${err.message}`
                  );
                }
              });
          }
        }

        // CASO 4: FOLGA + ABRIU (Hora Extra - folga_trabalhada)
        if (estadoSlot === 'FOLGA') {
          if (aberturasEletricista && aberturasEletricista.itens.length > 0) {
            // Buscar abertura mais relevante (na equipe prevista ou primeira)
            const abertura =
              aberturasEletricista.itens.find(
                (a) => a.turnoRealizado.equipeId === params.equipePrevistaId
              ) || aberturasEletricista.itens[0];

            const horasRealizadas = this.calcularHorasTrabalhadas(
              abertura.abertoEm,
              abertura.fechadoEm
            );

            await prisma.horaExtra
              .create({
                data: {
                  dataReferencia: dataRef,
                  eletricistaId: slot.eletricistaId,
                  turnoRealizadoEletricistaId: abertura.id,
                  escalaSlotId: slot.id,
                  tipo: 'folga_trabalhada',
                  horasPrevistas: new Prisma.Decimal(0),
                  horasRealizadas: new Prisma.Decimal(horasRealizadas),
                  diferencaHoras: new Prisma.Decimal(horasRealizadas),
                  status: 'pendente',
                  createdBy: params.executadoPor,
                },
              })
              .catch((err: any) => {
                if (err.code !== 'P2002') {
                  this.logger.warn(
                    `Erro ao criar hora extra (folga_trabalhada) para eletricista ${slot.eletricistaId}: ${err.message}`
                  );
                }
              });
          }
          // CASO 5: FOLGA + NÃO ABRIU (Normal - sem ação)
        }

        // CASO 6: EXCECAO ou outros estados - tratar como trabalho normal
        if (estadoSlot === 'EXCECAO' || estadoSlot === 'FALTA') {
          // Tratar similar ao TRABALHO
          if (
            !aberturasEletricista ||
            aberturasEletricista.equipes.size === 0
          ) {
            if (!statusJustificaFalta) {
              await prisma.falta
                .create({
                  data: {
                    dataReferencia: dataRef,
                    equipeId: params.equipePrevistaId,
                    eletricistaId: slot.eletricistaId,
                    escalaSlotId: slot.id,
                    motivoSistema: 'falta_abertura',
                    status: 'pendente',
                    createdBy: 'system',
                  },
                })
                .catch(() => {});
            }
          }
        }
      }

      // 5. Processar turnos abertos SEM escala (CASO 6: extrafora)
      for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
        // Verificar se este eletricista tinha algum slot na escala
        const tinhaSlotNaEscala = slots.some(
          (s) => s.eletricistaId === eletricistaId
        );

        if (!tinhaSlotNaEscala) {
          // Eletricista abriu turno sem estar na escala = trabalho extrafora
          for (const abertura of aberturas.itens) {
            // Verificar se já existe hora extra para este turno
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

              await prisma.horaExtra
                .create({
                  data: {
                    dataReferencia: dataRef,
                    eletricistaId,
                    turnoRealizadoEletricistaId: abertura.id,
                    tipo: 'extrafora',
                    horasPrevistas: new Prisma.Decimal(0),
                    horasRealizadas: new Prisma.Decimal(horasRealizadas),
                    diferencaHoras: new Prisma.Decimal(horasRealizadas),
                    status: 'pendente',
                    createdBy: params.executadoPor,
                  },
                })
                .catch((err: any) => {
                  if (err.code !== 'P2002') {
                    this.logger.warn(
                      `Erro ao criar hora extra (extrafora) para eletricista ${eletricistaId}: ${err.message}`
                    );
                  }
                });
            }
          }
        }
      }

      this.logger.log(
        `Reconciliação concluída para equipe ${params.equipePrevistaId} em ${params.dataReferencia}`
      );
    } catch (error) {
      this.logger.error(
        `Erro na reconciliação para equipe ${params.equipePrevistaId} em ${params.dataReferencia}: ${error}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Processa atraso e verifica se foi compensado (CASO 7)
   */
  private async processarAtraso(
    prisma: any,
    slot: any,
    abertura: any,
    executadoPor: string
  ): Promise<void> {
    if (!slot.inicioPrevisto) return;

    // Converter horário previsto para Date
    const [hora, minuto] = slot.inicioPrevisto.split(':').map(Number);
    const dataRef = new Date(slot.data);
    dataRef.setHours(hora, minuto, 0, 0);

    // Horário limite (previsto + 30 minutos)
    const horarioLimite = new Date(dataRef);
    horarioLimite.setMinutes(horarioLimite.getMinutes() + 30);

    // Verificar se houve atraso
    if (abertura.abertoEm > horarioLimite) {
      // Calcular horas previstas e realizadas
      const horasPrevistas = this.calcularHorasPrevistas(slot);
      const horasRealizadas = this.calcularHorasTrabalhadas(
        abertura.abertoEm,
        abertura.fechadoEm
      );

      // Verificar se compensou (trabalhou mais horas)
      const diferenca = horasRealizadas - Number(horasPrevistas);
      const compensou = diferenca >= 0;

      if (compensou) {
        // Criar hora extra de atraso compensado
        await prisma.horaExtra
          .create({
            data: {
              dataReferencia: slot.data,
              eletricistaId: slot.eletricistaId,
              turnoRealizadoEletricistaId: abertura.id,
              escalaSlotId: slot.id,
              tipo: 'atraso_compensado',
              horasPrevistas: new Prisma.Decimal(horasPrevistas),
              horasRealizadas: new Prisma.Decimal(horasRealizadas),
              diferencaHoras: new Prisma.Decimal(diferenca),
              observacoes: `Atraso de ${Math.round(
                (abertura.abertoEm.getTime() - dataRef.getTime()) / 1000 / 60
              )} minutos compensado`,
              status: 'pendente',
              createdBy: executadoPor,
            },
          })
          .catch((err: any) => {
            if (err.code !== 'P2002') {
              this.logger.warn(
                `Erro ao criar hora extra (atraso_compensado) para eletricista ${slot.eletricistaId}: ${err.message}`
              );
            }
          });
      } else {
        // Não compensou - pode criar falta parcial ou apenas logar
        this.logger.warn(
          `Eletricista ${slot.eletricistaId} atrasou e não compensou em ${slot.data}`
        );
      }
    }
  }

  /**
   * Calcula horas previstas a partir do slot de escala
   */
  private calcularHorasPrevistas(slot: any): number {
    if (slot.inicioPrevisto && slot.fimPrevisto) {
      const [horaInicio, minutoInicio] = slot.inicioPrevisto
        .split(':')
        .map(Number);
      const [horaFim, minutoFim] = slot.fimPrevisto.split(':').map(Number);

      const minutosInicio = horaInicio * 60 + minutoInicio;
      const minutosFim = horaFim * 60 + minutoFim;

      const diferencaMinutos = minutosFim - minutosInicio;
      return diferencaMinutos / 60;
    }

    // Se não tem horários no slot, retorna 0 (será calculado depois se necessário)
    return 0;
  }

  /**
   * Calcula horas trabalhadas a partir de abertura e fechamento
   */
  private calcularHorasTrabalhadas(
    abertoEm: Date,
    fechadoEm: Date | null
  ): number {
    if (!fechadoEm) {
      // Turno ainda aberto - usar hora atual
      const agora = new Date();
      const diferencaMs = agora.getTime() - abertoEm.getTime();
      return diferencaMs / (1000 * 60 * 60); // Converter para horas
    }

    const diferencaMs = fechadoEm.getTime() - abertoEm.getTime();
    return diferencaMs / (1000 * 60 * 60); // Converter para horas
  }
}
