'use server';

import { prisma } from '@/lib/db/db.service';
import { mobileUserModulePermissionsSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

export const listMobileUserModulePermissions = async (rawData: unknown) =>
  handleServerAction(
    mobileUserModulePermissionsSchema,
    async ({ mobileUserId }, session) => {
      requireManageMobileUserPermissions(session);
      return prisma.mobileUserModulePermission.findMany({
        where: { mobileUserId },
        include: { mobileModule: true },
        orderBy: { mobileModule: { ordem: 'asc' } },
      });
    },
    rawData,
    { entityName: 'MobileUserModulePermission', actionType: 'list' }
  );
