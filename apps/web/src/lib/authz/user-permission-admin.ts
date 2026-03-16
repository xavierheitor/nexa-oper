import { canManageUserPermissions } from './user-access';
import {
  PERMISSION_CATALOG,
  type Permission,
  type PermissionCatalogItem,
} from './permissions';

export interface PermissionCatalogGroup {
  key: string;
  label: string;
  permissions: PermissionCatalogItem[];
}

export interface AvailablePermissionProfile {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  permissions: Permission[];
}

export interface UserPermissionSummary {
  user: {
    id: number;
    nome: string;
    email: string;
    username: string;
  };
  assignedProfile: AvailablePermissionProfile | null;
  availableProfiles: AvailablePermissionProfile[];
  profilePermissions: Permission[];
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

export { canManageUserPermissions };
