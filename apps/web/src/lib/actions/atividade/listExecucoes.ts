'use server';

import { Prisma } from '@nexa-oper/db';
import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import {
  atividadeDashboardBaseFilterSchema,
  buildAtividadeExecucaoWhere,
} from './_common';

const listAtividadeExecucoesSchema = atividadeDashboardBaseFilterSchema.extend({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(10),
  orderBy: z.string().default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
});

export const listAtividadeExecucoes = async (rawData: unknown) =>
  handleServerAction(
    listAtividadeExecucoesSchema,
    async (data) => {
      const where = buildAtividadeExecucaoWhere(data);

      if (data.search) {
        const search = data.search;
        const andConditions: Prisma.AtividadeExecucaoWhereInput[] = [];
        if (Array.isArray(where.AND)) {
          andConditions.push(...where.AND);
        } else if (where.AND) {
          andConditions.push(where.AND);
        }

        andConditions.push({
          OR: [
            { atividadeUuid: { contains: search } },
            { numeroDocumento: { contains: search } },
            { tipoAtividadeNomeSnapshot: { contains: search } },
            { tipoServicoNomeSnapshot: { contains: search } },
            { statusFluxo: { contains: search } },
          ],
        });

        where.AND = andConditions;
      }

      const page = data.page;
      const pageSize = data.pageSize;
      const skip = (page - 1) * pageSize;

      const orderByMap: Record<
        string,
        Prisma.AtividadeExecucaoOrderByWithRelationInput
      > = {
        id: { id: data.orderDir },
        createdAt: { createdAt: data.orderDir },
        updatedAt: { updatedAt: data.orderDir },
        finalizadaEm: { finalizadaEm: data.orderDir },
        statusFluxo: { statusFluxo: data.orderDir },
      };

      const orderBy = orderByMap[data.orderBy] || orderByMap.createdAt;

      const [items, total] = await Promise.all([
        prisma.atividadeExecucao.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
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
            atividadeMedidor: {
              select: { id: true },
            },
            atividadeMateriaisAplicados: {
              select: { id: true, quantidade: true },
            },
          },
        }),
        prisma.atividadeExecucao.count({ where }),
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
    { entityName: 'AtividadeExecucao', actionType: 'list' }
  );
