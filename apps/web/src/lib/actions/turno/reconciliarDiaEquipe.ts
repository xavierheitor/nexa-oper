/**
 * Server Action para Reconciliação de Turnos
 *
 * Compara turnos realizados com escala planejada e gera:
 * - Faltas (quando escalado não abriu)
 * - Divergências (quando abriu em equipe diferente)
 * - Horas Extras (quando trabalhou em folga, extrafora, ou compensou atraso)
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { Prisma } from '@nexa-oper/db';

const reconciliarSchema = z.object({
  dataReferencia: z.coerce.date(), // ISO date
  equipePrevistaId: z.number(),
  executadoPor: z.string().optional().default('sistema'),
});

export interface ReconciliarParams {
  dataReferencia: Date | string;
  equipePrevistaId: number;
  executadoPor: string;
}

/**
 * Função interna de reconciliação (sem autenticação)
 * Pode ser chamada diretamente pelo scheduler
 */
export async function reconciliarDiaEquipeInterna(params: ReconciliarParams): Promise<{
  success: boolean;
  equipeId: number;
  dataReferencia: Date;
}> {
  const dataRef = new Date(params.dataReferencia);
  const dataRefInicio = new Date(dataRef);
  dataRefInicio.setHours(0, 0, 0, 0);
  const dataRefFim = new Date(dataRef);
  dataRefFim.setHours(23, 59, 59, 999);

  console.log(
    `[Reconciliação] Iniciando reconciliação para equipe ${params.equipePrevistaId} em ${params.dataReferencia}`
  );

  try {
    return await executarReconciliacaoLógica({
      dataReferencia: dataRef,
      dataRefInicio,
      dataRefFim,
      equipePrevistaId: params.equipePrevistaId,
      executadoPor: params.executadoPor,
    });
  } catch (error) {
    console.error(
      `[Reconciliação] Erro na reconciliação para equipe ${params.equipePrevistaId} em ${params.dataReferencia}:`,
      error
    );
    throw error;
  }
}

interface ExecutarReconciliacaoParams {
  dataReferencia: Date;
  dataRefInicio: Date;
  dataRefFim: Date;
  equipePrevistaId: number;
  executadoPor: string;
}

async function executarReconciliacaoLógica(data: ExecutarReconciliacaoParams): Promise<{
  success: boolean;
  equipeId: number;
  dataReferencia: Date;
}> {
  const { dataReferencia, dataRefInicio, dataRefFim, equipePrevistaId, executadoPor } = data;

  // 1. Buscar slots da escala (previstos) com estado e horários
  // Buscar slots da equipe específica para processar faltas/divergências desta equipe
  const slots = await prisma.slotEscala.findMany({
    where: {
      data: {
        gte: dataRefInicio,
        lte: dataRefFim,
      },
      escalaEquipePeriodo: { equipeId: equipePrevistaId },
    },
    include: {
      eletricista: {
        include: {
          Status: true, // Status atual do eletricista
        },
      },
    },
  });

  // 1b. Buscar TODOS os slots do dia (de todas as equipes) para verificar se eletricista tinha escala
  // Isso é necessário para detectar corretamente "extrafora" (trabalho sem escala)
  const todosSlotsDia = await prisma.slotEscala.findMany({
    where: {
      data: {
        gte: dataRefInicio,
        lte: dataRefFim,
      },
      escalaEquipePeriodo: {
        status: 'PUBLICADA', // Apenas escalas publicadas
      },
    },
    select: {
      eletricistaId: true,
    },
  });

  // Criar Set de eletricistas que têm escala no dia (qualquer equipe)
  const eletricistasComEscala = new Set(todosSlotsDia.map((s) => s.eletricistaId));

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
        aberturasEletricista.equipes.has(equipePrevistaId)
      ) {
        // Verificar atraso (Caso 7)
        const aberturaNaEquipe = aberturasEletricista.itens.find(
          (a) => a.turnoRealizado.equipeId === equipePrevistaId
        );

        if (aberturaNaEquipe && slot.inicioPrevisto) {
          await processarAtraso(prisma, slot, aberturaNaEquipe, executadoPor);
        }
        // Caso normal, sem ação adicional
        continue;
      }

      // CASO 2: TRABALHO + NÃO ABRIU na equipe prevista
      // Verificar se abriu em OUTRA equipe primeiro
      if (!aberturasEletricista || !aberturasEletricista.equipes.has(equipePrevistaId)) {
        // CASO 3: TRABALHO + ABRIU em EQUIPE DIFERENTE (Divergência)
        // Se abriu em outra equipe, criar divergência e NÃO criar falta
        if (aberturasEletricista && aberturasEletricista.equipes.size > 0) {
          const equipeRealId = [...aberturasEletricista.equipes][0];
          // Usar upsert para garantir idempotência
          await prisma.divergenciaEscala.upsert({
            where: {
              dataReferencia_eletricistaId_equipePrevistaId_equipeRealId: {
                dataReferencia: dataReferencia,
                eletricistaId: slot.eletricistaId,
                equipePrevistaId: equipePrevistaId,
                equipeRealId,
              },
            },
            update: {}, // Não atualizar se já existe
            create: {
              dataReferencia: dataReferencia,
              equipePrevistaId: equipePrevistaId,
              equipeRealId,
              eletricistaId: slot.eletricistaId,
              tipo: 'equipe_divergente',
              detalhe: null,
              createdBy: executadoPor,
            },
          }).catch((err: any) => {
            if (err.code !== 'P2002') {
              console.warn(
                `[Reconciliação] Erro ao criar/atualizar divergência para eletricista ${slot.eletricistaId}: ${err.message}`
              );
            }
          });
          // Não criar falta pois eletricista trabalhou em outra equipe
          continue;
        }

        // CASO 2: TRABALHO + NÃO ABRIU em NENHUMA equipe (Falta)
        // Verificar se há justificativa de equipe aprovada que não gera falta
        const justificativaEquipe = await prisma.justificativaEquipe.findUnique({
          where: {
            dataReferencia_equipeId: {
              dataReferencia: dataReferencia,
              equipeId: equipePrevistaId,
            },
          },
          include: {
            tipoJustificativa: true,
          },
        });

        // Se há justificativa aprovada que não gera falta, não criar falta individual
        if (
          justificativaEquipe &&
          justificativaEquipe.status === 'aprovada' &&
          !justificativaEquipe.tipoJustificativa.geraFalta
        ) {
          // Conta como dia trabalhado (não criar falta)
          console.debug(
            `[Reconciliação] Eletricista ${slot.eletricistaId} não abriu, mas equipe tem justificativa aprovada que não gera falta`
          );
          continue;
        }

        // Não criar falta se status do eletricista justifica ausência
        if (!statusJustificaFalta) {
          // Usar upsert para garantir idempotência
          await prisma.falta.upsert({
            where: {
              dataReferencia_equipeId_eletricistaId_motivoSistema: {
                dataReferencia: dataReferencia,
                equipeId: equipePrevistaId,
                eletricistaId: slot.eletricistaId,
                motivoSistema: 'falta_abertura',
              },
            },
            update: {}, // Não atualizar se já existe
            create: {
              dataReferencia: dataReferencia,
              equipeId: equipePrevistaId,
              eletricistaId: slot.eletricistaId,
              escalaSlotId: slot.id,
              motivoSistema: 'falta_abertura',
              status: 'pendente',
              createdBy: 'system',
            },
          }).catch((err: any) => {
            // Log apenas erros não esperados
            if (err.code !== 'P2002') {
              console.warn(
                `[Reconciliação] Erro ao criar/atualizar falta para eletricista ${slot.eletricistaId}: ${err.message}`
              );
            }
          });
        }
        continue;
      }

      // Se chegou aqui, eletricista abriu na equipe prevista (CASO 1 já tratado acima)
      // Este código não deveria ser executado, mas mantido por segurança
      continue;
    }

    // CASO 4: FOLGA + ABRIU (Hora Extra - folga_trabalhada)
    if (estadoSlot === 'FOLGA') {
      if (aberturasEletricista && aberturasEletricista.itens.length > 0) {
        // Buscar abertura mais relevante (na equipe prevista ou primeira)
        const abertura =
          aberturasEletricista.itens.find(
            (a) => a.turnoRealizado.equipeId === equipePrevistaId
          ) || aberturasEletricista.itens[0];

        // Verificar se já existe hora extra para este turno (idempotência)
        const jaExiste = await prisma.horaExtra.findFirst({
          where: {
            turnoRealizadoEletricistaId: abertura.id,
            tipo: 'folga_trabalhada',
          },
        });

        if (!jaExiste) {
          const horasRealizadas = calcularHorasTrabalhadas(
            abertura.abertoEm,
            abertura.fechadoEm
          );

          await prisma.horaExtra
            .create({
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
                createdBy: executadoPor,
              },
            })
            .catch((err: any) => {
              if (err.code !== 'P2002') {
                console.warn(
                  `[Reconciliação] Erro ao criar hora extra (folga_trabalhada) para eletricista ${slot.eletricistaId}: ${err.message}`
                );
              }
            });
        }
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
          // Usar upsert para garantir idempotência
          await prisma.falta.upsert({
            where: {
              dataReferencia_equipeId_eletricistaId_motivoSistema: {
                dataReferencia: dataReferencia,
                equipeId: equipePrevistaId,
                eletricistaId: slot.eletricistaId,
                motivoSistema: 'falta_abertura',
              },
            },
            update: {}, // Não atualizar se já existe
            create: {
              dataReferencia: dataReferencia,
              equipeId: equipePrevistaId,
              eletricistaId: slot.eletricistaId,
              escalaSlotId: slot.id,
              motivoSistema: 'falta_abertura',
              status: 'pendente',
              createdBy: 'system',
            },
          }).catch(() => {}); // Ignorar erros silenciosamente
        }
      }
    }
  }

  // 5. Processar turnos abertos SEM escala (CASO 6: extrafora)
  for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
    // Verificar se este eletricista tinha algum slot na escala (em QUALQUER equipe)
    // Usar todosSlotsDia ao invés de slots para verificar todas as equipes
    const tinhaSlotNaEscala = eletricistasComEscala.has(eletricistaId);

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
          const horasRealizadas = calcularHorasTrabalhadas(
            abertura.abertoEm,
            abertura.fechadoEm
          );

          await prisma.horaExtra
            .create({
              data: {
                dataReferencia: dataReferencia,
                eletricistaId,
                turnoRealizadoEletricistaId: abertura.id,
                tipo: 'extrafora',
                horasPrevistas: new Prisma.Decimal(0),
                horasRealizadas: new Prisma.Decimal(horasRealizadas),
                diferencaHoras: new Prisma.Decimal(horasRealizadas),
                status: 'pendente',
                createdBy: executadoPor,
              },
            })
            .catch((err: any) => {
              if (err.code !== 'P2002') {
                console.warn(
                  `[Reconciliação] Erro ao criar hora extra (extrafora) para eletricista ${eletricistaId}: ${err.message}`
                );
              }
            });
        }
      }
    }
  }

  // 6. Verificar se equipe estava escalada mas não abriu turno
  const slotsTrabalho = slots.filter(s => s.estado === 'TRABALHO');
  if (slotsTrabalho.length > 0) {
    const turnosAbertosEquipe = await prisma.turnoRealizado.findFirst({
      where: {
        equipeId: equipePrevistaId,
        dataReferencia: {
          gte: dataRefInicio,
          lte: dataRefFim,
        },
      },
    });

    // Se tinha slots de trabalho mas não abriu turno
    if (!turnosAbertosEquipe) {
      // Verificar se já existe caso pendente
      const casoExistente = await prisma.casoJustificativaEquipe.findUnique({
        where: {
          dataReferencia_equipeId: {
            dataReferencia: dataReferencia,
            equipeId: equipePrevistaId,
          },
        },
      });

      if (!casoExistente) {
        await prisma.casoJustificativaEquipe
          .create({
            data: {
              dataReferencia: dataReferencia,
              equipeId: equipePrevistaId,
              slotsEscalados: slotsTrabalho.length,
              status: 'pendente',
              createdBy: 'system',
            },
          })
          .catch((err: any) => {
            if (err.code !== 'P2002') {
              console.warn(
                `[Reconciliação] Erro ao criar caso de justificativa de equipe para equipe ${equipePrevistaId}: ${err.message}`
              );
            }
          });
      }
    }
  }

  console.log(
    `[Reconciliação] Reconciliação concluída para equipe ${equipePrevistaId} em ${dataReferencia}`
  );

  return {
    success: true,
    equipeId: equipePrevistaId,
    dataReferencia: dataReferencia,
  };
}

/**
 * Server Action para reconciliar turnos (com autenticação)
 * Reconcilia turnos de uma equipe em um dia específico
 * Idempotente por chaves únicas nas tabelas
 */
export const reconciliarDiaEquipe = async (rawData: unknown) =>
  handleServerAction(
    reconciliarSchema,
    async (data) => {
      return await reconciliarDiaEquipeInterna({
        dataReferencia: data.dataReferencia,
        equipePrevistaId: data.equipePrevistaId,
        executadoPor: data.executadoPor,
      });
    },
    rawData,
    { entityName: 'ReconciliacaoTurno', actionType: 'create' }
  );

/**
 * Processa atraso e verifica se foi compensado (CASO 7)
 */
async function processarAtraso(
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
    const horasPrevistas = calcularHorasPrevistas(slot);
    const horasRealizadas = calcularHorasTrabalhadas(
      abertura.abertoEm,
      abertura.fechadoEm
    );

    // Verificar se compensou (trabalhou mais horas)
    const diferenca = horasRealizadas - Number(horasPrevistas);
    const compensou = diferenca >= 0;

    if (compensou) {
      // Verificar se já existe hora extra para este turno (idempotência)
      const jaExiste = await prisma.horaExtra.findFirst({
        where: {
          turnoRealizadoEletricistaId: abertura.id,
          tipo: 'atraso_compensado',
        },
      });

      if (!jaExiste) {
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
              console.warn(
                `[Reconciliação] Erro ao criar hora extra (atraso_compensado) para eletricista ${slot.eletricistaId}: ${err.message}`
              );
            }
          });
      }
    } else {
      // Não compensou - pode criar falta parcial ou apenas logar
      console.warn(
        `[Reconciliação] Eletricista ${slot.eletricistaId} atrasou e não compensou em ${slot.data}`
      );
    }
  }
}

/**
 * Calcula horas previstas a partir do slot de escala
 */
function calcularHorasPrevistas(slot: any): number {
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
function calcularHorasTrabalhadas(
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

