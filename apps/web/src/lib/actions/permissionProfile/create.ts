'use server';

import { prisma } from '@/lib/db/db.service';
import { isPermission } from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const createPermissionProfileSchema = z.object({
  key: z.string().trim().min(1).max(100),
  nome: z.string().trim().min(1).max(255),
  descricao: z.string().trim().max(500).optional().nullable(),
  ativo: z.boolean().optional().default(true),
  permissions: z.array(z.string()).default([]),
});

export const createPermissionProfile = async (rawData: unknown) =>
  handleServerAction(
    createPermissionProfileSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const permissions = [...new Set(data.permissions)].filter(isPermission);

      const profile = await prisma.permissionProfile.create({
        data: {
          key: data.key,
          nome: data.nome,
          descricao: data.descricao || null,
          ativo: data.ativo,
          createdBy: session.user.id,
          updatedBy: session.user.id,
          PermissionProfileGrant: permissions.length
            ? {
                createMany: {
                  data: permissions.map((permission) => ({
                    permission,
                    createdBy: session.user.id,
                    updatedBy: session.user.id,
                  })),
                },
              }
            : undefined,
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
        },
      });

      return {
        ...profile,
        permissions,
      };
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'create' },
  );
