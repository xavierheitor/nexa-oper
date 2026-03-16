'use server';

import { prisma } from '@/lib/db/db.service';
import { isPermission } from '@/lib/types/permissions';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';
import { z } from 'zod';

const listPermissionProfilesSchema = z.object({
  ativo: z.boolean().optional(),
});

export const listPermissionProfiles = async (rawData: unknown = {}) =>
  handleServerAction(
    listPermissionProfilesSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const profiles = await prisma.permissionProfile.findMany({
        where: {
          ...(data.ativo === undefined ? {} : { ativo: data.ativo }),
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
        orderBy: {
          nome: 'asc',
        },
      });

      return profiles.map((profile) => ({
        id: profile.id,
        key: profile.key,
        nome: profile.nome,
        descricao: profile.descricao,
        ativo: profile.ativo,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        permissions: profile.PermissionProfileGrant.map((item) => item.permission).filter(
          isPermission,
        ),
        usersCount: profile._count.users,
      }));
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'list' },
  );
