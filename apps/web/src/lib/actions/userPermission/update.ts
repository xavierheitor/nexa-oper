'use server';

import { prisma } from '@/lib/db/db.service';
import {
  getPermissionsByRoles,
  isPermission,
  normalizeRoles,
  type Permission,
} from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const updateUserPermissionGrantsSchema = z.object({
  userId: z.number().int().positive(),
  permissions: z.array(z.string()).default([]),
});

export const updateUserPermissionGrants = async (rawData: unknown) =>
  handleServerAction(
    updateUserPermissionGrantsSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          RoleUser: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new Error('Usuário não encontrado.');
      }

      const roles = normalizeRoles(user.RoleUser.map((item) => item.role.nome));
      const inheritedPermissions = new Set<Permission>(
        getPermissionsByRoles(roles),
      );
      const directPermissions = [...new Set(data.permissions)]
        .filter(isPermission)
        .filter((permission) => !inheritedPermissions.has(permission));

      await prisma.$transaction(async (tx) => {
        await tx.userPermissionGrant.deleteMany({
          where: {
            userId: data.userId,
          },
        });

        if (directPermissions.length > 0) {
          await tx.userPermissionGrant.createMany({
            data: directPermissions.map((permission) => ({
              userId: data.userId,
              permission,
              createdBy: session.user.id,
              updatedBy: session.user.id,
            })),
          });
        }
      });

      return {
        userId: data.userId,
        directPermissions,
      };
    },
    rawData,
    { entityName: 'UserPermissionGrant', actionType: 'update' },
  );
