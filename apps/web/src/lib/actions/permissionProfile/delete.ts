'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const deletePermissionProfileSchema = z.object({
  profileId: z.number().int().positive(),
});

export const deletePermissionProfile = async (rawData: unknown) =>
  handleServerAction(
    deletePermissionProfileSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const usersUsingProfile = await prisma.user.count({
        where: {
          permissionProfileId: data.profileId,
          deletedAt: null,
        },
      });

      if (usersUsingProfile > 0) {
        throw new Error(
          'Não é possível excluir um grupo de permissões vinculado a usuários.',
        );
      }

      await prisma.permissionProfile.delete({
        where: {
          id: data.profileId,
        },
      });

      return {
        profileId: data.profileId,
        deletedBy: session.user.id,
      };
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'delete' },
  );
