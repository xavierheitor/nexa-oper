import { PERMISSIONS, type Permission, type Role } from './permissions';

function hasPermission(
  permissions: readonly Permission[],
  permission: Permission,
): boolean {
  return permissions.includes(permission);
}

export function canViewContracts(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.CONTRATOS_VIEW);
}

export function canCreateContracts(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.CONTRATOS_CREATE);
}

export function canUpdateContracts(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.CONTRATOS_UPDATE);
}

export function canDeleteContracts(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.CONTRATOS_DELETE);
}

export function canViewVehicles(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.VEICULOS_VIEW);
}

export function canCreateVehicles(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.VEICULOS_CREATE);
}

export function canUpdateVehicles(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.VEICULOS_UPDATE);
}

export function canDeleteVehicles(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.VEICULOS_DELETE);
}

export function canViewTeams(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.EQUIPES_VIEW);
}

export function canCreateTeams(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.EQUIPES_CREATE);
}

export function canUpdateTeams(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.EQUIPES_UPDATE);
}

export function canDeleteTeams(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.EQUIPES_DELETE);
}

export function canViewElectricians(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.ELETRICISTAS_VIEW);
}

export function canCreateElectricians(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.ELETRICISTAS_CREATE);
}

export function canUpdateElectricians(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.ELETRICISTAS_UPDATE);
}

export function canDeleteElectricians(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.ELETRICISTAS_DELETE);
}

export function canViewMobileUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.MOBILE_USERS_VIEW);
}

export function canCreateMobileUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.MOBILE_USERS_CREATE);
}

export function canUpdateMobileUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.MOBILE_USERS_UPDATE);
}

export function canDeleteMobileUsers(
  _roles: readonly Role[],
  permissions: readonly Permission[],
): boolean {
  return hasPermission(permissions, PERMISSIONS.MOBILE_USERS_DELETE);
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
