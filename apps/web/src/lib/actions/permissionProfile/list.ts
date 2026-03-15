'use server';

import { prisma } from '@/lib/db/db.service';
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

      return prisma.permissionProfile.findMany({
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
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'list' },
  );
