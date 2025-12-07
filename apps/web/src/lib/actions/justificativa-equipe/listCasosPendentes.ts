/**
 * Server Action para listar casos pendentes de justificativa de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { prisma } from '../../db/db.service';
import { z } from 'zod';

const listCasosPendentesSchema = z.object({
  status: z.enum(['pendente', 'justificado', 'ignorado']).optional(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  equipeId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(20),
});

/**
 * Lista casos pendentes de justificativa de equipe
 */
export const listCasosJustificativaEquipe = async (rawData: unknown) =>
  handleServerAction(
    listCasosPendentesSchema,
    async (data) => {
      const where: any = {};

      if (data.status) {
        where.status = data.status;
      }

      if (data.equipeId) {
        where.equipeId = data.equipeId;
      }

      if (data.dataInicio || data.dataFim) {
        where.dataReferencia = {};
        if (data.dataInicio) {
          where.dataReferencia.gte = data.dataInicio;
        }
        if (data.dataFim) {
          const dataFim = new Date(data.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          where.dataReferencia.lte = dataFim;
        }
      }

      const [casos, total] = await Promise.all([
        prisma.casoJustificativaEquipe.findMany({
          where,
          include: {
            equipe: {
              select: {
                id: true,
                nome: true,
              },
            },
            justificativaEquipe: {
              select: {
                id: true,
                status: true,
                tipoJustificativa: {
                  select: {
                    nome: true,
                    geraFalta: true,
                  },
                },
              },
            },
          },
          orderBy: {
            dataReferencia: 'desc',
          },
          skip: (data.page - 1) * data.pageSize,
          take: data.pageSize,
        }),
        prisma.casoJustificativaEquipe.count({ where }),
      ]);

      // Para cada caso, contar quantas faltas individuais foram geradas
      const casosComFaltas = await Promise.all(
        casos.map(async (caso) => {
          const faltasCount = await prisma.falta.count({
            where: {
              equipeId: caso.equipeId,
              dataReferencia: caso.dataReferencia,
              motivoSistema: 'falta_abertura',
            },
          });

          return {
            ...caso,
            faltasGeradas: faltasCount,
          };
        })
      );

      return {
        items: casosComFaltas,
        total,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
    rawData,
    { entityName: 'CasoJustificativaEquipe', actionType: 'list' }
  );

