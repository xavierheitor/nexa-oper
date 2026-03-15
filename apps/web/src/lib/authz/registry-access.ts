import { PERMISSIONS, type Permission, type Role } from './permissions';

function isAdmin(roles: readonly Role[]): boolean {
  return roles.includes('admin');
}

function hasPermission(
  permissions: readonly Permission[],
  permission: Permission,
): boolean {
  return permissions.includes(permission);
}

export function canViewContracts(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.CONTRATOS_VIEW);
}

export function canCreateContracts(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.CONTRATOS_CREATE)
  );
}

export function canUpdateContracts(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.CONTRATOS_UPDATE)
  );
}

export function canDeleteContracts(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.CONTRATOS_DELETE)
  );
}

export function canViewVehicles(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.VEICULOS_VIEW);
}

export function canCreateVehicles(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.VEICULOS_CREATE);
}

export function canUpdateVehicles(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.VEICULOS_UPDATE);
}

export function canDeleteVehicles(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.VEICULOS_DELETE);
}

export function canViewTeams(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.EQUIPES_VIEW);
}

export function canCreateTeams(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.EQUIPES_CREATE);
}

export function canUpdateTeams(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.EQUIPES_UPDATE);
}

export function canDeleteTeams(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return isAdmin(roles) || hasPermission(permissions, PERMISSIONS.EQUIPES_DELETE);
}

export function canViewElectricians(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.ELETRICISTAS_VIEW)
  );
}

export function canCreateElectricians(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) ||
    hasPermission(permissions, PERMISSIONS.ELETRICISTAS_CREATE)
  );
}

export function canUpdateElectricians(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) ||
    hasPermission(permissions, PERMISSIONS.ELETRICISTAS_UPDATE)
  );
}

export function canDeleteElectricians(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) ||
    hasPermission(permissions, PERMISSIONS.ELETRICISTAS_DELETE)
  );
}

export function canViewMobileUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.MOBILE_USERS_VIEW)
  );
}

export function canCreateMobileUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.MOBILE_USERS_CREATE)
  );
}

export function canUpdateMobileUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.MOBILE_USERS_UPDATE)
  );
}

export function canDeleteMobileUsers(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return (
    isAdmin(roles) || hasPermission(permissions, PERMISSIONS.MOBILE_USERS_DELETE)
  );
}

export function canManageMobileUserPermissions(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return canUpdateMobileUsers(roles, permissions);
}

export function canResetMobileUserPasswords(
  roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return canUpdateMobileUsers(roles, permissions);
}
