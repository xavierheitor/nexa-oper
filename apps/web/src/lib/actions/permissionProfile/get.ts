'use server';

import { prisma } from '@/lib/db/db.service';
import { isPermission } from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const getPermissionProfileSchema = z.object({
  profileId: z.number().int().positive(),
});

export const getPermissionProfile = async (rawData: unknown) =>
  handleServerAction(
    getPermissionProfileSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const profile = await prisma.permissionProfile.findUnique({
        where: {
          id: data.profileId,
        },
        include: {
          PermissionProfileGrant: {
            select: {
              permission: true,
            },
            orderBy: {
              permission: 'asc',
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!profile) {
        throw new Error('Grupo de permissões não encontrado.');
      }

      return {
        ...profile,
        permissions: profile.PermissionProfileGrant.map((item) => item.permission).filter(
          isPermission,
        ),
      };
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'get' },
  );
