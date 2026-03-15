import { PERMISSIONS, type Permission, type Role } from './permissions';

function isAdmin(roles: readonly Role[]): boolean {
  return roles.includes('admin');
}

export function canViewUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || permissions.includes(PERMISSIONS.USERS_VIEW);
}

export function canCreateUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || permissions.includes(PERMISSIONS.USERS_CREATE);
}

export function canUpdateUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || permissions.includes(PERMISSIONS.USERS_UPDATE);
}

export function canDeleteUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || permissions.includes(PERMISSIONS.USERS_DELETE);
}

export function canResetUserPasswords(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return canUpdateUsers(roles, permissions);
}

export function canManageUserPermissions(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return canUpdateUsers(roles, permissions);
}
