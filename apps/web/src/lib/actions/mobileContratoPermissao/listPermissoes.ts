'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const listPermissoesSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  mobileUserId: z.number().int().positive().optional(),
});

export const listMobileContratoPermissoes = async (rawData: unknown = {}) =>
  handleServerAction(
    listPermissoesSchema,
    async (params) => {
      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      if (params.mobileUserId) {
        where.mobileUserId = params.mobileUserId;
      }

      const [data, total] = await Promise.all([
        prisma.mobileContratoPermissao.findMany({
          where,
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
          orderBy: {
            [params.orderBy]: params.orderDir,
          } as Record<string, 'asc' | 'desc'>,
          include: {
            contrato: true,
            mobileUser: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        }),
        prisma.mobileContratoPermissao.count({ where }),
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
    { entityName: 'MobileContratoPermissao', actionType: 'list' }
  );
