'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const listContratosSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export const listContratos = async (rawData: unknown = {}) =>
  handleServerAction(
    listContratosSchema,
    async (params) => {
      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      if (params.search) {
        where.OR = [
          { nome: { contains: params.search } },
          { numero: { contains: params.search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.contrato.findMany({
          where,
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
          orderBy: {
            [params.orderBy]: params.orderDir,
          } as Record<string, 'asc' | 'desc'>,
        }),
        prisma.contrato.count({ where }),
      ]);

      return {
        data,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      };
    },
    rawData,
    { entityName: 'Contrato', actionType: 'list' }
  );
