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
    async (data) => {
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
        dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (data.periodo === 'trimestre') {
        const agora = new Date();
        const trimestre = Math.floor(agora.getMonth() / 3);
        dataInicio = new Date(agora.getFullYear(), trimestre * 3, 1);
        dataFim = new Date(agora.getFullYear(), (trimestre + 1) * 3, 0, 23, 59, 59, 999);
      } else {
        dataInicio = data.dataInicio ? new Date(data.dataInicio) : new Date();
        dataFim = data.dataFim ? new Date(data.dataFim) : new Date();
      }

      // Buscar dados agregados em paralelo (evita N+1 queries)
      const [
        turnosRealizados,
        faltas,
        horasExtras,
        slotsEscala,
      ] = await Promise.all([
        // Turnos realmente abertos
        prisma.turnoRealizadoEletricista.findMany({
          where: {
            eletricistaId: data.eletricistaId,
            abertoEm: { gte: dataInicio, lte: dataFim },
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
            dataReferencia: { gte: dataInicio, lte: dataFim },
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
            dataReferencia: { gte: dataInicio, lte: dataFim },
          },
        }),

        // Slots de escala (para calcular dias escalados) - buscar TODOS os slots (TRABALHO e FOLGA)
        prisma.slotEscala.findMany({
          where: {
            eletricistaId: data.eletricistaId,
            data: { gte: dataInicio, lte: dataFim },
            // Buscar todos os estados para saber quais dias têm escala
          },
        }),
      ]);

      // Calcular resumo
      const diasTrabalhados = new Set(
        turnosRealizados.map((t) => t.abertoEm.toISOString().split('T')[0])
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
        (f) => f.status === 'justificada'
      ).length;
      const faltasPendentes = faltas.filter(
        (f) => f.status === 'pendente'
      ).length;

      const horasExtrasTotal = horasExtras.reduce(
        (sum, he) => sum + Number(he.horasRealizadas),
        0
      );
      const horasExtrasAprovadas = horasExtras
        .filter((he) => he.status === 'aprovada')
        .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);
      const horasExtrasPendentes = horasExtras
        .filter((he) => he.status === 'pendente')
        .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);

      // ✅ CORREÇÃO: Processar detalhamento mostrando ESCALA e o que ACONTECEU
      // Estratégia: Processar primeiro a ESCALA (TRABALHO e FOLGA), depois o que ACONTECEU
      const detalhamento: any[] = [];
      const detalhamentoPorData = new Map<string, any[]>();

      // Helper para calcular horas a partir de strings "HH:MM:SS"
      const calcularHorasDeString = (inicio: string | null, fim: string | null): number => {
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

        const horasPrevistas = calcularHorasDeString(slot.inicioPrevisto, slot.fimPrevisto);

        detalhamentoPorData.get(dataStr)!.push({
          data: slot.data,
          tipo: slot.estado === 'TRABALHO' ? 'escala_trabalho' : 'escala_folga',
          horasPrevistas,
          horasRealizadas: 0,
          status: 'normal',
          slotId: slot.id,
        });
      }

      // 2. Processar turnos realizados (o que ACONTECEU)
      for (const turno of turnosRealizados) {
        const dataStr = turno.abertoEm.toISOString().split('T')[0];
        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        const horasRealizadas = turno.fechadoEm
          ? (turno.fechadoEm.getTime() - turno.abertoEm.getTime()) / (1000 * 60 * 60)
          : 0;

        // Verificar se há slot de escala para este dia
        const slotDia = slotsEscala.find(
          s => s.data.toISOString().split('T')[0] === dataStr
        );

        // Se trabalhou em dia de TRABALHO na escala, adicionar como trabalho realizado
        if (slotDia && slotDia.estado === 'TRABALHO') {
          detalhamentoPorData.get(dataStr)!.push({
            data: turno.abertoEm,
            tipo: 'trabalho_realizado',
            horasPrevistas: calcularHorasDeString(slotDia.inicioPrevisto, slotDia.fimPrevisto),
            horasRealizadas,
            status: 'normal',
            equipe: turno.turnoRealizado?.equipe ? {
              id: turno.turnoRealizado.equipe.id,
              nome: turno.turnoRealizado.equipe.nome,
            } : undefined,
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
            equipe: turno.turnoRealizado?.equipe ? {
              id: turno.turnoRealizado.equipe.id,
              nome: turno.turnoRealizado.equipe.nome,
            } : undefined,
            horaInicio: turno.abertoEm,
            horaFim: turno.fechadoEm || undefined,
            turnoId: turno.id,
            tipoHoraExtra: slotDia && slotDia.estado === 'FOLGA' ? 'folga_trabalhada' : 'extrafora',
          });
        }
      }

      // 3. Processar faltas (o que ACONTECEU quando deveria trabalhar)
      for (const falta of faltas) {
        const dataStr = falta.dataReferencia.toISOString().split('T')[0];
        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        // Verificar se há slot de TRABALHO para este dia
        const slotDia = slotsEscala.find(
          s => s.data.toISOString().split('T')[0] === dataStr && s.estado === 'TRABALHO'
        );

        // Só adicionar falta se havia escala de TRABALHO
        if (slotDia) {
          detalhamentoPorData.get(dataStr)!.push({
            data: falta.dataReferencia,
            tipo: 'falta',
            horasPrevistas: calcularHorasDeString(slotDia.inicioPrevisto, slotDia.fimPrevisto),
            horasRealizadas: 0,
            status: falta.status,
            faltaId: falta.id,
          });
        }
      }

      // 4. Processar horas extras registradas (para garantir que apareçam)
      for (const horaExtra of horasExtras) {
        const dataStr = horaExtra.dataReferencia.toISOString().split('T')[0];
        if (!detalhamentoPorData.has(dataStr)) {
          detalhamentoPorData.set(dataStr, []);
        }

        // Verificar se já existe hora extra para este dia
        const jaTemHoraExtra = detalhamentoPorData.get(dataStr)!.some(
          d => d.tipo === 'hora_extra'
        );

        if (!jaTemHoraExtra) {
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
      detalhamentoPorData.forEach((dias) => {
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

