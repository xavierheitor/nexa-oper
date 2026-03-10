export {
  ALL_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_CATALOG,
  PERMISSION_GROUP_LABELS,
  ROLE_PERMISSIONS,
  ROLES,
  getPermissionsByRole,
  getPermissionsByRoles,
  hasPermission,
  hasRole,
  isPermission,
  normalizeRoleName,
  normalizeRoles,
  resolveEffectivePermissions,
} from '@/lib/authz/permissions';

export type {
  PermissionCatalogItem,
  Permission,
  Role,
  UserPermissions,
} from '@/lib/authz/permissions';
