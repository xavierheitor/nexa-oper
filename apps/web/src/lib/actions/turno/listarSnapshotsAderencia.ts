/**
 * Server Action para listar snapshots históricos de aderência
 *
 * Permite consultar o histórico de aderência de turnos previstos
 * por período, equipe, status, etc.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const listarSnapshotsSchema = z.object({
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  equipeId: z.number().optional(),
  tipoEquipeId: z.number().optional(),
  status: z.enum(['ADERENTE', 'NAO_ADERENTE', 'NAO_ABERTO', 'TURNO_EXTRA']).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  orderBy: z.string().default('dataReferencia'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Lista snapshots de aderência com filtros
 *
 * @param rawData - Filtros e paginação
 * @returns Lista paginada de snapshots
 */
export const listarSnapshotsAderencia = async (rawData: unknown) =>
  handleServerAction(
    listarSnapshotsSchema,
    async (data) => {
      const where: any = {
        deletedAt: null,
      };

      // Filtro de data
      if (data.dataInicio || data.dataFim) {
        where.dataReferencia = {};
        if (data.dataInicio) {
          const inicio = new Date(data.dataInicio);
          inicio.setHours(0, 0, 0, 0);
          where.dataReferencia.gte = inicio;
        }
        if (data.dataFim) {
          const fim = new Date(data.dataFim);
          fim.setHours(23, 59, 59, 999);
          where.dataReferencia.lte = fim;
        }
      }

      // Filtros opcionais
      if (data.equipeId) {
        where.equipeId = data.equipeId;
      }
      if (data.tipoEquipeId) {
        where.tipoEquipeId = data.tipoEquipeId;
      }
      if (data.status) {
        where.status = data.status;
      }

      // Contar total
      const total = await prisma.aderenciaEscalaSnapshot.count({ where });

      // Buscar com paginação
      const skip = (data.page - 1) * data.pageSize;
      const snapshots = await prisma.aderenciaEscalaSnapshot.findMany({
        where,
        skip,
        take: data.pageSize,
        orderBy: {
          [data.orderBy]: data.orderDir,
        },
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
              tipoEquipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          turno: {
            select: {
              id: true,
              dataInicio: true,
            },
          },
        },
      });

      // Parse dos IDs dos eletricistas
      const snapshotsComEletricistas = snapshots.map((snapshot) => {
        const eletricistasIds = JSON.parse(snapshot.eletricistasPrevistosIds || '[]') as number[];
        return {
          ...snapshot,
          eletricistasIds,
        };
      });

      return {
        data: snapshotsComEletricistas,
        pagination: {
          page: data.page,
          pageSize: data.pageSize,
          total,
          totalPages: Math.ceil(total / data.pageSize),
        },
      };
    },
    rawData,
    { entityName: 'AderenciaEscalaSnapshot', actionType: 'get' }
  );

