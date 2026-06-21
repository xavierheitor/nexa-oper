'use server';

import { prisma } from '@/lib/db/db.service';
import { mobileModuleUpdateSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

export const updateMobileModule = async (rawData: unknown) =>
  handleServerAction(
    mobileModuleUpdateSchema,
    async ({ id, ...data }, session) => {
      requireManageMobileUserPermissions(session);
      return prisma.mobileModule.update({
        where: { id },
        data: {
          ...data,
          descricao: data.descricao || null,
          updatedBy: session.user.id,
        },
      });
    },
    rawData,
    { entityName: 'MobileModule', actionType: 'update' }
  );
