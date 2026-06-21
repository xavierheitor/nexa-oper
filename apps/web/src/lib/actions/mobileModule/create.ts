'use server';

import { prisma } from '@/lib/db/db.service';
import { mobileModuleCreateSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

export const createMobileModule = async (rawData: unknown) =>
  handleServerAction(
    mobileModuleCreateSchema,
    async (data, session) => {
      requireManageMobileUserPermissions(session);
      return prisma.mobileModule.create({
        data: {
          ...data,
          descricao: data.descricao || null,
          createdBy: session.user.id,
        },
      });
    },
    rawData,
    { entityName: 'MobileModule', actionType: 'create' }
  );
