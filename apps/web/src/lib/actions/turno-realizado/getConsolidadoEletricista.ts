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

        // Slots de escala (para calcular dias escalados)
        prisma.slotEscala.findMany({
          where: {
            eletricistaId: data.eletricistaId,
            data: { gte: dataInicio, lte: dataFim },
            estado: 'TRABALHO',
          },
        }),
      ]);

      // Calcular resumo
      const diasTrabalhados = new Set(
        turnosRealizados.map((t) => t.abertoEm.toISOString().split('T')[0])
      ).size;

      const diasEscalados = slotsEscala.length;
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

      // Detalhamento por dia
      const detalhamento: any[] = [];
      const diasProcessados = new Set<string>();

      // Processar turnos realizados
      for (const turno of turnosRealizados) {
        const dataStr = turno.abertoEm.toISOString().split('T')[0];
        if (!diasProcessados.has(dataStr)) {
          diasProcessados.add(dataStr);
          const horasRealizadas = turno.fechadoEm
            ? (turno.fechadoEm.getTime() - turno.abertoEm.getTime()) / (1000 * 60 * 60)
            : 0;

          detalhamento.push({
            data: turno.abertoEm,
            tipo: 'trabalho',
            horasPrevistas: 0, // Será calculado se houver slot
            horasRealizadas,
            status: 'normal',
          });
        }
      }

      // Processar faltas
      for (const falta of faltas) {
        const dataStr = falta.dataReferencia.toISOString().split('T')[0];
        if (!diasProcessados.has(dataStr)) {
          diasProcessados.add(dataStr);
          detalhamento.push({
            data: falta.dataReferencia,
            tipo: 'falta',
            horasPrevistas: 0,
            horasRealizadas: 0,
            status: falta.status,
            faltaId: falta.id,
          });
        }
      }

      // Processar horas extras
      for (const horaExtra of horasExtras) {
        const dataStr = horaExtra.dataReferencia.toISOString().split('T')[0];
        const existing = detalhamento.find(
          (d) => d.data.toISOString().split('T')[0] === dataStr
        );
        if (existing) {
          existing.tipo = 'hora_extra';
          existing.tipoHoraExtra = horaExtra.tipo;
          existing.horaExtraId = horaExtra.id;
        } else {
          detalhamento.push({
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

      // Adicionar folgas (slots com estado FOLGA que não foram trabalhados)
      const slotsFolga = await prisma.slotEscala.findMany({
        where: {
          eletricistaId: data.eletricistaId,
          data: { gte: dataInicio, lte: dataFim },
          estado: 'FOLGA',
        },
      });

      for (const slot of slotsFolga) {
        const dataStr = slot.data.toISOString().split('T')[0];
        if (!diasProcessados.has(dataStr)) {
          diasProcessados.add(dataStr);
          detalhamento.push({
            data: slot.data,
            tipo: 'folga',
            horasPrevistas: 0,
            horasRealizadas: 0,
            status: 'normal',
          });
        }
      }

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
      };

      // Validar resposta com schema Zod
      return consolidadoEletricistaResponseSchema.parse(resultado);
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'get' }
  );

