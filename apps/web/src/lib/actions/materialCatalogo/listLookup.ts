'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireMateriaisCatalogoLookupPermission } from '../common/permissionGuard';

const listMateriaisCatalogoLookupSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(1000),
  orderBy: z.string().default('descricao'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export const listMateriaisCatalogoLookup = async (rawData: unknown = {}) =>
  handleServerAction(
    listMateriaisCatalogoLookupSchema,
    async (params, session) => {
      requireMateriaisCatalogoLookupPermission(session);

      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      if (params.search) {
        where.OR = [
          { codigo: { contains: params.search } },
          { descricao: { contains: params.search } },
        ];
      }

      const [data, total] = await Promise.all([
        prisma.materialCatalogo.findMany({
          where,
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
          orderBy: {
            [params.orderBy]: params.orderDir,
          } as Record<string, 'asc' | 'desc'>,
        }),
        prisma.materialCatalogo.count({ where }),
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
    { entityName: 'MaterialCatalogo', actionType: 'list' }
  );
