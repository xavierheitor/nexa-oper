import { PERMISSIONS, type Permission, type Role } from './permissions';

export function canViewUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return permissions.includes(PERMISSIONS.USERS_VIEW);
}

export function canCreateUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return permissions.includes(PERMISSIONS.USERS_CREATE);
}

export function canUpdateUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return permissions.includes(PERMISSIONS.USERS_UPDATE);
}

export function canDeleteUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return permissions.includes(PERMISSIONS.USERS_DELETE);
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
