'use server';

import { Prisma } from '@nexa-oper/db';
import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import {
  atividadeDashboardBaseFilterSchema,
  buildAtividadeExecucaoWhere,
} from './_common';

const listAtividadeMateriaisSchema = atividadeDashboardBaseFilterSchema.extend({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(10),
  orderBy: z.string().default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

export const listAtividadeMateriais = async (rawData: unknown) =>
  handleServerAction(
    listAtividadeMateriaisSchema,
    async (data) => {
      const atividadeWhere = buildAtividadeExecucaoWhere(data);
      const where: Prisma.AtividadeMaterialAplicadoWhereInput = {
        atividadeExecucao: {
          is: atividadeWhere,
        },
      };

      if (data.search) {
        const search = data.search;
        const andConditions: Prisma.AtividadeMaterialAplicadoWhereInput[] = [];
        if (Array.isArray(where.AND)) {
          andConditions.push(...where.AND);
        } else if (where.AND) {
          andConditions.push(where.AND);
        }

        andConditions.push({
          OR: [
            { materialCodigoSnapshot: { contains: search } },
            { materialDescricaoSnapshot: { contains: search } },
            { unidadeMedidaSnapshot: { contains: search } },
            {
              materialCatalogo: {
                is: { codigo: { contains: search } },
              },
            },
            {
              materialCatalogo: {
                is: { descricao: { contains: search } },
              },
            },
            {
              atividadeExecucao: {
                is: { atividadeUuid: { contains: search } },
              },
            },
            {
              atividadeExecucao: {
                is: { numeroDocumento: { contains: search } },
              },
            },
          ],
        });

        where.AND = andConditions;
      }

      const page = data.page;
      const pageSize = data.pageSize;
      const skip = (page - 1) * pageSize;

      const orderByMap: Record<
        string,
        Prisma.AtividadeMaterialAplicadoOrderByWithRelationInput
      > = {
        id: { id: data.orderDir },
        createdAt: { createdAt: data.orderDir },
        updatedAt: { updatedAt: data.orderDir },
        quantidade: { quantidade: data.orderDir },
      };

      const orderBy = orderByMap[data.orderBy] || orderByMap.createdAt;

      const [items, total] = await Promise.all([
        prisma.atividadeMaterialAplicado.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          include: {
            materialCatalogo: {
              select: {
                id: true,
                codigo: true,
                descricao: true,
              },
            },
            atividadeExecucao: {
              include: {
                tipoAtividade: {
                  select: { id: true, nome: true },
                },
                tipoAtividadeServico: {
                  select: { id: true, nome: true },
                },
                turno: {
                  select: {
                    id: true,
                    dataInicio: true,
                    dataFim: true,
                    equipe: {
                      select: { id: true, nome: true },
                    },
                    veiculo: {
                      select: { id: true, placa: true, modelo: true },
                    },
                    TurnoEletricistas: {
                      where: { deletedAt: null },
                      select: {
                        id: true,
                        motorista: true,
                        eletricista: {
                          select: { id: true, nome: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.atividadeMaterialAplicado.count({ where }),
      ]);

      return {
        data: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    rawData,
    { entityName: 'AtividadeMaterialAplicado', actionType: 'list' }
  );
