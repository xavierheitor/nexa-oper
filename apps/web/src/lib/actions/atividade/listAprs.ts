'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { requireActivitiesPermission } from '@/lib/actions/common/permissionGuard';

const listAtividadeAprsSchema = z.object({
  turnoId: z.number().int().positive(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(500).default(200),
});

export const listAtividadeAprs = async (rawData: unknown) =>
  handleServerAction(
    listAtividadeAprsSchema,
    async (data, session) => {
      requireActivitiesPermission(session);
      const page = data.page;
      const pageSize = data.pageSize;
      const skip = (page - 1) * pageSize;

      const where = {
        turnoId: data.turnoId,
        deletedAt: null,
      } as const;

      const [items, total] = await Promise.all([
        prisma.atividadeAprPreenchida.findMany({
          where,
          orderBy: { preenchidaEm: 'desc' },
          skip,
          take: pageSize,
          include: {
            apr: {
              select: {
                id: true,
                nome: true,
              },
            },
            atividadeExecucao: {
              select: {
                id: true,
                atividadeUuid: true,
                numeroDocumento: true,
                tipoAtividadeNomeSnapshot: true,
                tipoServicoNomeSnapshot: true,
              },
            },
            _count: {
              select: {
                respostas: true,
                assinaturas: true,
              },
            },
          },
        }),
        prisma.atividadeAprPreenchida.count({ where }),
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
    { entityName: 'AtividadeAprPreenchida', actionType: 'list' }
  );
