'use server';

import { prisma } from '@/lib/db/db.service';
import { setMobileUserModulePermissionsSchema } from '@/lib/schemas/mobileModuleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

export const setMobileUserModulePermissions = async (rawData: unknown) =>
  handleServerAction(
    setMobileUserModulePermissionsSchema,
    async ({ mobileUserId, moduleIds }, session) => {
      requireManageMobileUserPermissions(session);
      const uniqueModuleIds = [...new Set(moduleIds)];
      const [user, modules] = await Promise.all([
        prisma.mobileUser.findFirst({
          where: { id: mobileUserId, deletedAt: null },
          select: { id: true },
        }),
        prisma.mobileModule.findMany({
          where: {
            id: { in: uniqueModuleIds },
            ativo: true,
            deletedAt: null,
          },
          select: { id: true },
        }),
      ]);
      if (!user) throw new Error('Usuário mobile não encontrado.');
      if (modules.length !== uniqueModuleIds.length) {
        throw new Error(
          'Um ou mais módulos selecionados são inválidos ou inativos.'
        );
      }
      await prisma.$transaction(async tx => {
        await tx.mobileUserModulePermission.deleteMany({
          where: { mobileUserId },
        });
        if (uniqueModuleIds.length > 0) {
          await tx.mobileUserModulePermission.createMany({
            data: uniqueModuleIds.map(mobileModuleId => ({
              mobileUserId,
              mobileModuleId,
              createdBy: session.user.id,
            })),
          });
        }
      });
      return { mobileUserId, moduleIds: uniqueModuleIds };
    },
    rawData,
    { entityName: 'MobileUserModulePermission', actionType: 'update' }
  );
