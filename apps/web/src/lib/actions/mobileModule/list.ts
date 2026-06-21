'use server';

import { prisma } from '@/lib/db/db.service';
import { mobileModuleFilterSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireViewMobileUsersPermission } from '../common/permissionGuard';

export const listMobileModules = async (rawData: unknown = {}) =>
  handleServerAction(
    mobileModuleFilterSchema,
    async (params, session) => {
      requireViewMobileUsersPermission(session);
      const where = {
        deletedAt: null,
        ...(params.onlyActive === true ? { ativo: true } : {}),
        ...(params.search
          ? {
              OR: [
                { nome: { contains: params.search } },
                { key: { contains: params.search } },
              ],
            }
          : {}),
      };
      const [data, total] = await Promise.all([
        prisma.mobileModule.findMany({
          where,
          skip: (params.page - 1) * params.pageSize,
          take: params.pageSize,
          orderBy: [{ [params.orderBy]: params.orderDir }, { id: 'asc' }],
        }),
        prisma.mobileModule.count({ where }),
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
    { entityName: 'MobileModule', actionType: 'list' }
  );
