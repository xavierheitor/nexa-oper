'use server';

import { prisma } from '@/lib/db/db.service';
import { isPermission } from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageUserPermissions } from '../common/permissionGuard';

const updatePermissionProfileSchema = z.object({
  profileId: z.number().int().positive(),
  key: z.string().trim().min(1).max(100),
  nome: z.string().trim().min(1).max(255),
  descricao: z.string().trim().max(500).optional().nullable(),
  ativo: z.boolean(),
  permissions: z.array(z.string()).default([]),
});

export const updatePermissionProfile = async (rawData: unknown) =>
  handleServerAction(
    updatePermissionProfileSchema,
    async (data, session) => {
      requireManageUserPermissions(session);

      const permissions = [...new Set(data.permissions)].filter(isPermission);

      await prisma.$transaction(async (tx) => {
        await tx.permissionProfile.update({
          where: {
            id: data.profileId,
          },
          data: {
            key: data.key,
            nome: data.nome,
            descricao: data.descricao || null,
            ativo: data.ativo,
            updatedBy: session.user.id,
          },
        });

        await tx.permissionProfileGrant.deleteMany({
          where: {
            profileId: data.profileId,
          },
        });

        if (permissions.length > 0) {
          await tx.permissionProfileGrant.createMany({
            data: permissions.map((permission) => ({
              profileId: data.profileId,
              permission,
              createdBy: session.user.id,
              updatedBy: session.user.id,
            })),
          });
        }
      });

      return {
        profileId: data.profileId,
        permissions,
      };
    },
    rawData,
    { entityName: 'PermissionProfile', actionType: 'update' },
  );
