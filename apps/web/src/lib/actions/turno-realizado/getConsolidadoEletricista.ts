/**
 * Server Action para obter dados consolidados de frequência de um eletricista
 *
 * Consulta diretamente o banco de dados usando Prisma, sem depender da API externa.
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import {
  consolidadoEletricistaResponseSchema,
  periodoSchema,
} from '../../schemas/turnoRealizadoSchema';
import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';

const getConsolidadoEletricistaSchema = z.object({
  eletricistaId: z.number().int().positive(),
  periodo: periodoSchema.shape.periodo.optional().default('custom'),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

/**
 * Obtém dados consolidados de frequência de um eletricista
 *
 * Consulta diretamente o banco de dados para obter:
 * - Turnos realizados
 * - Faltas
 * - Horas extras
 * - Slots de escala
 *
 * Retorna um resumo consolidado e detalhamento por dia.
 */
export const getConsolidadoEletricista = async (rawData: unknown) =>
  handleServerAction(
    getConsolidadoEletricistaSchema,
    async data => {
      // Verificar se eletricista existe
      const eletricista = await prisma.eletricista.findUnique({
        where: { id: data.eletricistaId },
        select: { id: true, nome: true, matricula: true },
      });

      if (!eletricista) {
        throw new Error(`Eletricista ${data.eletricistaId} não encontrado`);
      }

      // Calcular período
      let dataInicio: Date;
      let dataFim: Date;

      if (data.periodo === 'mes') {
        const agora = new Date();
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
        dataFim = new Date(
          agora.getFullYear(),
          agora.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      } else if (data.periodo === 'trimestre') {
        const agora = new Date();
        const trimestre = Math.floor(agora.getMonth() / 3);
        dataInicio = new Date(agora.getFullYear(), trimestre * 3, 1);
        dataFim = new Date(
          agora.getFullYear(),
          (trimestre + 1) * 3,
          0,
          23,
          59,
          59,
          999
        );
      } else {
        dataInicio = data.dataInicio ? new Date(data.dataInicio) : new Date();
        dataFim = data.dataFim ? new Date(data.dataFim) : new Date();
      }

      // Buscar dados agregados em paralelo (evita N+1 queries)
      // Ajustar range de busca de turnos para pegar turnos que começam antes
      // mas terminam dentro do período (ou cruzam a meia-noite)
      const dataInicioBuffer = new Date(dataInicio);
      dataInicioBuffer.setDate(dataInicioBuffer.getDate() - 1);

      const dataFimBuffer = new Date(dataFim);
      dataFimBuffer.setDate(dataFimBuffer.getDate() + 1);

      const [turnosRealizados, faltas, horasExtras, slotsEscala] =
        await Promise.all([
          // Turnos realmente abertos (com buffer)
          prisma.turnoRealizadoEletricista.findMany({
            where: {
              eletricistaId: data.eletricistaId,
              abertoEm: { gte: dataInicioBuffer, lte: dataFimBuffer },
            },
            include: {
              turnoRealizado: {
                select: {
                  equipeId: true,
                  equipe: {
                    select: { id: true, nome: true },
                  },
                },
              },
            },
          }),

          // Faltas
          prisma.falta.findMany({
            where: {
              eletricistaId: data.eletricistaId,
              dataReferencia: { gte: dataInicioBuffer, lte: dataFimBuffer },
            },
            include: {
              Justificativas: {
                include: {
                  justificativa: {
                    select: { status: true },
                  },
                },
              },
            },
          }),

          // Horas extras
          prisma.horaExtra.findMany({
            where: {
              eletricistaId: data.eletricistaId,
              dataReferencia: { gte: dataInicioBuffer, lte: dataFimBuffer },
            },
          }),

          // Slots de escala (para calcular dias escalados) - buscar TODOS os slots (TRABALHO e FOLGA)
          prisma.slotEscala.findMany({
            where: {
              eletricistaId: data.eletricistaId,
              data: { gte: dataInicioBuffer, lte: dataFimBuffer },
              // Buscar todos os estados para saber quais dias têm escala
            },
            include: {
              escalaEquipePeriodo: {
                select: {
                  equipe: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          }),
        ]);

      // Calcular resumo
      const diasTrabalhados = new Set(
        turnosRealizados
          .filter(t => t.abertoEm >= dataInicio && t.abertoEm <= dataFim)
          .map(t => t.abertoEm.toISOString().split('T')[0])
      ).size;

      // Filtrar apenas slots de TRABALHO para calcular dias escalados
      const slotsTrabalho = slotsEscala.filter(s => s.estado === 'TRABALHO');
      const diasEscalados = slotsTrabalho.length;

      // Criar mapa de dias com escala (qualquer estado) para uso no calendário
      const diasComEscala = new Set<string>();
      slotsEscala.forEach(slot => {
        const dataStr = slot.data.toISOString().split('T')[0];
        diasComEscala.add(dataStr);
      });

      const faltasTotal = faltas.length;
      const faltasJustificadas = faltas.filter(
        f => f.status === 'justificada'
      ).length;
      const faltasPendentes = faltas.filter(
        f => f.status === 'pendente'
      ).length;

      const horasExtrasTotal = horasExtras.reduce(
        (sum, he) => sum + Number(he.horasRealizadas),
        0
      );
      const horasExtrasAprovadas = horasExtras
        .filter(he => he.status === 'aprovada')
        .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);
      const horasExtrasPendentes = horasExtras
        .filter(he => he.status === 'pendente')
        .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);

      // ✅ CORREÇÃO: Processar detalhamento mostrando ESCALA e o que ACONTECEU
      // Estratégia: Processar primeiro a ESCALA (TRABALHO e FOLGA), depois o que ACONTECEU
      const detalhamento: any[] = [];
      const detalhamentoPorData = new Map<string, any[]>();

      // Helper para calcular horas a partir de strings "HH:MM:SS"
      const calcularHorasDeString = (
        inicio: string | null,
        fim: string | null
      ): number => {
        if (!inicio || !fim) return 0;
        try {
          const [hInicio, mInicio] = inicio.split(':').map(Number);
          const [hFim, mFim] = fim.split(':').map(Number);
          const minutosInicio = hInicio * 60 + mInicio;
          const minutosFim = hFim * 60 + mFim;
          const diferencaMinutos = minutosFim - minutosInicio;
          return diferencaMinutos / 60;
        } catch {
          return 0;
        }
      };

      // 1. PRIMEIRO: Processar TODOS os slots de escala (TRABALHO e FOLGA)
      // Isso mostra o que estava previsto na escala
      for (const slot of slotsEscala) {
        const dataStr = slot.data.toISOString().split('T')[0];
        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        const horasPrevistas = calcularHorasDeString(
          slot.inicioPrevisto,
          slot.fimPrevisto
        );

        const equipe = slot.escalaEquipePeriodo?.equipe;

        detalhamentoPorData.get(dataStr)!.push({
          data: slot.data,
          tipo: slot.estado === 'TRABALHO' ? 'escala_trabalho' : 'escala_folga',
          horasPrevistas,
          horasRealizadas: 0,
          status: 'normal',
          slotId: slot.id,
          equipe: equipe ? { id: equipe.id, nome: equipe.nome } : undefined,
        });
      }

      // 2. Processar turnos realizados (o que ACONTECEU)
      // Filtrar turnos dentro do periodo "oficial" para exibição, mas usar todos para validação
      const turnosNoPeriodo = turnosRealizados.filter(
        t => t.abertoEm >= dataInicio && t.abertoEm <= dataFim
      );

      // Helper simples para data referencial (ajuste fuso BR -3h)
      // Garante que um turno começando 23:00 (dia X) caia no dia X e não X+1
      const toRefDate = (d: Date) => {
        const offset = 3 * 60 * 60 * 1000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
      };

      for (const turno of turnosNoPeriodo) {
        const dataStr = toRefDate(turno.abertoEm);

        if (!detalhamentoPorData.has(dataStr)) {
          // Se não existir o dia no map (ex: turno extra em dia sem escala), inicializa
          detalhamentoPorData.set(dataStr, []);
        }

        const horasRealizadas = turno.fechadoEm
          ? (turno.fechadoEm.getTime() - turno.abertoEm.getTime()) /
            (1000 * 60 * 60)
          : 0;

        // Verificar se há slot de escala para este dia
        // Slot.data vem como 00:00 UTC (ex: 2024-01-15T00:00:00.000Z)
        // O dataStr já representa o dia operacional correto (ex: '2024-01-15')
        // Portanto, basta comparar a string YYYY-MM-DD do slot diretamente.

        const slotMatch = slotsEscala.find(
          s => s.data.toISOString().split('T')[0] === dataStr
        );

        console.log(
          `[DEBUG_FREQ] DiaRef: ${dataStr} | TurnoInicio: ${turno.abertoEm.toISOString()} | SlotFound: ${
            slotMatch ? 'SIM' : 'NÃO'
          } | SlotEstado: ${slotMatch?.estado || 'N/A'} | SlotData: ${slotMatch?.data.toISOString()} | EquipeTurno: ${
            turno.turnoRealizado?.equipe?.nome
          } | EquipeSlot: ${slotMatch?.escalaEquipePeriodo?.equipe.nome}`
        );

        // Se trabalhou em dia de TRABALHO na escala, adicionar como trabalho realizado
        if (slotMatch && slotMatch.estado === 'TRABALHO') {
          detalhamentoPorData.get(dataStr)!.push({
            data: turno.abertoEm,
            tipo: 'trabalho_realizado',
            horasPrevistas: calcularHorasDeString(
              slotMatch.inicioPrevisto,
              slotMatch.fimPrevisto
            ),
            horasRealizadas,
            status: 'normal',
            equipe: turno.turnoRealizado?.equipe
              ? {
                  id: turno.turnoRealizado.equipe.id,
                  nome: turno.turnoRealizado.equipe.nome,
                }
              : undefined,
            horaInicio: turno.abertoEm,
            horaFim: turno.fechadoEm || undefined,
            turnoId: turno.id,
          });
        } else {
          // Trabalhou em dia de FOLGA ou sem escala = HORA EXTRA
          detalhamentoPorData.get(dataStr)!.push({
            data: turno.abertoEm,
            tipo: 'hora_extra',
            horasPrevistas: 0,
            horasRealizadas,
            status: 'normal',
            equipe: turno.turnoRealizado?.equipe
              ? {
                  id: turno.turnoRealizado.equipe.id,
                  nome: turno.turnoRealizado.equipe.nome,
                }
              : undefined,
            horaInicio: turno.abertoEm,
            horaFim: turno.fechadoEm || undefined,
            turnoId: turno.id,
            tipoHoraExtra:
              slotMatch && slotMatch.estado === 'FOLGA'
                ? 'folga_trabalhada'
                : 'extrafora',
          });
        }
      }

      // 3. Processar faltas (o que ACONTECEU quando deveria trabalhar)
      for (const falta of faltas) {
        const dataStr = toRefDate(falta.dataReferencia);

        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        // Verificar se há slot de TRABALHO para este dia
        const slotDia = slotsEscala.find(
          s => s.data.toISOString().split('T')[0] === dataStr
        );

        const slotMatch = slotDia;

        // Só adicionar falta se havia escala de TRABALHO
        if (slotMatch && slotMatch.estado === 'TRABALHO') {
          // Validar se trabalhou NESSE DIA OPERACIONAL
          const trabalhouNoDia = turnosRealizados.some(t => {
            return toRefDate(t.abertoEm) === dataStr;
          });

          // Se trabalhou, NÃO mostra falta
          if (!trabalhouNoDia) {
            detalhamentoPorData.get(dataStr)!.push({
              data: falta.dataReferencia,
              tipo: 'falta',
              horasPrevistas: calcularHorasDeString(
                slotMatch.inicioPrevisto,
                slotMatch.fimPrevisto
              ),
              horasRealizadas: 0,
              status: falta.status,
              faltaId: falta.id,
            });
          }
        }
      }

      // 4. Processar horas extras registradas (para garantir que apareçam)
      for (const horaExtra of horasExtras) {
        const dataStr = horaExtra.dataReferencia.toISOString().split('T')[0];
        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        // Verificar se já existe hora extra ou TRABALHO REALIZADO para este dia
        // Se já trabalhou (e foi classificado como trabalho normal), não deve mostrar hora extra
        // (Regra: Trabalho em dia de T em outra equipe não é extra)
        const jaTemRegistroRelevante = detalhamentoPorData
          .get(dataStr)!
          .some(
            d => d.tipo === 'hora_extra' || d.tipo === 'trabalho_realizado'
          );

        if (!jaTemRegistroRelevante) {
          detalhamentoPorData.get(dataStr)!.push({
            data: horaExtra.dataReferencia,
            tipo: 'hora_extra',
            horasPrevistas: Number(horaExtra.horasPrevistas || 0),
            horasRealizadas: Number(horaExtra.horasRealizadas),
            tipoHoraExtra: horaExtra.tipo,
            status: horaExtra.status,
            horaExtraId: horaExtra.id,
          });
        }
      }

      // Converter mapa para array e ordenar
      detalhamentoPorData.forEach(dias => {
        detalhamento.push(...dias);
      });

      detalhamento.sort((a, b) => a.data.getTime() - b.data.getTime());

      detalhamento.sort((a, b) => a.data.getTime() - b.data.getTime());

      const resultado = {
        eletricista: {
          id: eletricista.id,
          nome: eletricista.nome,
          matricula: eletricista.matricula,
        },
        periodo: {
          dataInicio,
          dataFim,
        },
        resumo: {
          diasTrabalhados,
          diasEscalados,
          faltas: faltasTotal,
          faltasJustificadas,
          faltasPendentes,
          horasExtras: horasExtrasTotal,
          horasExtrasAprovadas,
          horasExtrasPendentes,
          atrasos: 0, // TODO: calcular atrasos
          divergenciasEquipe: 0, // TODO: calcular divergências
        },
        detalhamento,
        diasComEscala: Array.from(diasComEscala), // Lista de datas (YYYY-MM-DD) que têm escala
      };

      // Validar resposta com schema Zod
      return consolidadoEletricistaResponseSchema.parse(resultado);
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'get' }
  );
