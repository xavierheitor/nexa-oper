'use server';

import { prisma } from '@/lib/db/db.service';
import {
  isPermission,
  normalizeRoles,
  resolveEffectivePermissions,
  type Permission,
} from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const updateUserPermissionGrantsSchema = z.object({
  userId: z.number().int().positive(),
  profileId: z.number().int().positive().nullable().optional(),
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
          permissionProfile: {
            select: {
              id: true,
              PermissionProfileGrant: {
                select: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new Error('Usuário não encontrado.');
      }

      const roles = normalizeRoles(user.RoleUser.map((item) => item.role.nome));
      let profilePermissions: Permission[] = [];

      if (data.profileId != null) {
        const profile = await prisma.permissionProfile.findUnique({
          where: {
            id: data.profileId,
          },
          select: {
            id: true,
            ativo: true,
            PermissionProfileGrant: {
              select: {
                permission: true,
              },
            },
          },
        });

        if (!profile || !profile.ativo) {
          throw new Error('Grupo de permissões não encontrado.');
        }

        profilePermissions = profile.PermissionProfileGrant.map(
          (grant) => grant.permission,
        ).filter(isPermission);
      }

      const inheritedPermissions = new Set<Permission>(
        resolveEffectivePermissions(roles, [], profilePermissions),
      );
      const directPermissions = [...new Set(data.permissions)]
        .filter(isPermission)
        .filter((permission) => !inheritedPermissions.has(permission));

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: data.userId,
          },
          data: {
            permissionProfileId: data.profileId ?? null,
            updatedBy: session.user.id,
          },
        });

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
        profileId: data.profileId ?? null,
        directPermissions,
      };
    },
    rawData,
    { entityName: 'UserPermissionGrant', actionType: 'update' },
  );
