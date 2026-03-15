'use server';

import {
  buildPermissionCatalogGroups,
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
import { requireManageUserPermissions } from '../common/permissionGuard';

const getUserPermissionSummarySchema = z.object({
  userId: z.number().int().positive(),
});

export const getUserPermissionSummary = async (rawData: unknown) =>
  handleServerAction(
    getUserPermissionSummarySchema,
    async (data, session): Promise<UserPermissionSummary> => {
      requireManageUserPermissions(session);

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
          permissionProfile: {
            select: {
              id: true,
              key: true,
              nome: true,
              descricao: true,
              ativo: true,
              PermissionProfileGrant: {
                select: {
                  permission: true,
                },
                orderBy: {
                  permission: 'asc',
                },
              },
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new Error('Usuário não encontrado.');
      }

      const roleNames = user.RoleUser.map((item) => item.role.nome);
      const roles = normalizeRoles(roleNames);
      const rolePermissions = getPermissionsByRoles(roles);
      const profilePermissions =
        user.permissionProfile?.PermissionProfileGrant.map((grant) => grant.permission).filter(
          isPermission,
        ) ?? [];
      const inheritedPermissions = resolveEffectivePermissions(
        roles,
        [],
        profilePermissions,
      );
      const directPermissions = user.UserPermissionGrant.map(
        (grant) => grant.permission,
      ).filter(isPermission);
      const effectivePermissions = resolveEffectivePermissions(
        roles,
        directPermissions,
        profilePermissions,
      );

      const availableProfiles = await prisma.permissionProfile.findMany({
        where: {
          OR: [
            { ativo: true },
            ...(user.permissionProfile
              ? [{ id: user.permissionProfile.id }]
              : []),
          ],
        },
        select: {
          id: true,
          key: true,
          nome: true,
          descricao: true,
          ativo: true,
          PermissionProfileGrant: {
            select: {
              permission: true,
            },
            orderBy: {
              permission: 'asc',
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      });

      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          username: user.username,
        },
        roleNames,
        roles,
        assignedProfile: user.permissionProfile
          ? {
              id: user.permissionProfile.id,
              key: user.permissionProfile.key,
              nome: user.permissionProfile.nome,
              descricao: user.permissionProfile.descricao,
              ativo: user.permissionProfile.ativo,
              permissions: profilePermissions,
            }
          : null,
        availableProfiles: availableProfiles.map((profile) => ({
          id: profile.id,
          key: profile.key,
          nome: profile.nome,
          descricao: profile.descricao,
          ativo: profile.ativo,
          permissions: profile.PermissionProfileGrant.map((grant) => grant.permission).filter(
            isPermission,
          ),
        })),
        rolePermissions,
        profilePermissions,
        inheritedPermissions,
        directPermissions,
        effectivePermissions,
        catalog: buildPermissionCatalogGroups(),
      };
    },
    rawData,
    { entityName: 'UserPermissionGrant', actionType: 'get' },
  );
