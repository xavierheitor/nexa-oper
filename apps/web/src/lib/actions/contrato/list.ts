'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';

const listContratosSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export async function listContratos(rawData: any = {}) {
  try {
    const params = listContratosSchema.parse(rawData);

    const where: any = {
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
        },
      }),
      prisma.contrato.count({ where }),
    ]);

    return {
      success: true,
      data: {
        data,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    };
  }
}
