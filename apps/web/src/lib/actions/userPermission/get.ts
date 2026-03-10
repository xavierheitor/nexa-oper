'use server';

import {
  buildPermissionCatalogGroups,
  canManageUserPermissions,
  type UserPermissionSummary,
} from '@/lib/authz/user-permission-admin';
import { prisma } from '@/lib/db/db.service';
import {
  getPermissionsByRoles,
  isPermission,
  normalizeRoles,
  resolveEffectivePermissions,
} from '@/lib/types/permissions';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const getUserPermissionSummarySchema = z.object({
  userId: z.number().int().positive(),
});

export const getUserPermissionSummary = async (rawData: unknown) =>
  handleServerAction(
    getUserPermissionSummarySchema,
    async (data, session): Promise<UserPermissionSummary> => {
      if (
        !canManageUserPermissions(
          session.user.roles || [],
          session.user.permissions || [],
        )
      ) {
        throw new Error('Você não tem permissão para gerenciar permissões.');
      }

      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          RoleUser: {
            include: {
              role: true,
            },
          },
          UserPermissionGrant: {
            select: {
              permission: true,
            },
            orderBy: {
              permission: 'asc',
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new Error('Usuário não encontrado.');
      }

      const roleNames = user.RoleUser.map((item) => item.role.nome);
      const roles = normalizeRoles(roleNames);
      const inheritedPermissions = getPermissionsByRoles(roles);
      const directPermissions = user.UserPermissionGrant.map(
        (grant) => grant.permission,
      ).filter(isPermission);
      const effectivePermissions = resolveEffectivePermissions(
        roles,
        directPermissions,
      );

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          username: user.username,
        },
        roleNames,
        roles,
        inheritedPermissions,
        directPermissions,
        effectivePermissions,
        catalog: buildPermissionCatalogGroups(),
      };
    },
    rawData,
    { entityName: 'UserPermissionGrant', actionType: 'get' },
  );
