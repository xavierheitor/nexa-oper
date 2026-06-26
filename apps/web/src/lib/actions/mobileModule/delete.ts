'use server';

import { prisma } from '@/lib/db/db.service';
import { mobileModuleDeleteSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

export const deleteMobileModule = async (rawData: unknown) =>
  handleServerAction(
    mobileModuleDeleteSchema,
    async ({ id }, session) => {
      requireManageMobileUserPermissions(session);
      return prisma.mobileModule.update({
        where: { id },
        data: {
          ativo: false,
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      });
    },
    rawData,
    { entityName: 'MobileModule', actionType: 'delete' }
  );
