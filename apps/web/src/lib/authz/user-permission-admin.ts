import {
  PERMISSIONS,
  PERMISSION_CATALOG,
  type Permission,
  type PermissionCatalogItem,
  type Role,
} from './permissions';

export interface PermissionCatalogGroup {
  key: string;
  label: string;
  permissions: PermissionCatalogItem[];
}

export interface UserPermissionSummary {
  user: {
    id: number;
    nome: string;
    email: string;
    username: string;
  };
  roleNames: string[];
  roles: Role[];
  inheritedPermissions: Permission[];
  directPermissions: Permission[];
  effectivePermissions: Permission[];
  catalog: PermissionCatalogGroup[];
}

export function buildPermissionCatalogGroups(): PermissionCatalogGroup[] {
  const groups = new Map<string, PermissionCatalogItem[]>();

  PERMISSION_CATALOG.forEach((item) => {
    const groupItems = groups.get(item.group) ?? [];
    groupItems.push(item);
    groups.set(item.group, groupItems);
  });

  return Array.from(groups.entries()).map(([label, permissions]) => ({
    key: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    permissions,
  }));
}

export function canManageUserPermissions(
  roles: Role[],
  permissions: Permission[],
): boolean {
  return (
    roles.includes('admin') ||
    permissions.includes(PERMISSIONS.USUARIO_MANAGE) ||
    permissions.includes(PERMISSIONS.USERS_UPDATE)
  );
}
