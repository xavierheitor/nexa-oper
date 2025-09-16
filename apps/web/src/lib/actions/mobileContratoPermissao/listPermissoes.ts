'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';

const listPermissoesSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  mobileUserId: z.number().int().positive().optional(),
  include: z.any().optional(),
});

export async function listMobileContratoPermissoes(rawData: any = {}) {
  try {
    const params = listPermissoesSchema.parse(rawData);

    const where: any = {
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
        },
        include: {
          contrato: true,
          mobileUser: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      }),
      prisma.mobileContratoPermissao.count({ where })
    ]);

    return {
      success: true,
      data: {
        data,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      }
    };
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    };
  }
}
