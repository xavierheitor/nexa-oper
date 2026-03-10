export type Permission =
  | 'dashboard:view'
  | 'registry:view'
  | 'shifts:view'
  | 'activities:view'
  | 'attendance:view'
  | 'schedules:view'
  | 'safety:view'
  | 'reports:view'
  | 'apr:manage'
  | 'checklist:manage'
  | 'relatorio:view'
  | 'usuario:manage'
  | 'users:view'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'escalas:view'
  | 'escalas:create'
  | 'escalas:update'
  | 'escalas:delete'
  | 'escalas:publish'
  | 'eletricistas:view'
  | 'eletricistas:create'
  | 'eletricistas:update'
  | 'eletricistas:delete'
  | 'equipes:view'
  | 'equipes:create'
  | 'equipes:update'
  | 'equipes:delete';

export type Role = 'admin' | 'gerente' | 'usuario' | 'supervisor';

export interface UserPermissions {
  permissions: Permission[];
  roles: Role[];
  isAdmin: boolean;
}

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view' as const,
  REGISTRY_VIEW: 'registry:view' as const,
  SHIFTS_VIEW: 'shifts:view' as const,
  ACTIVITIES_VIEW: 'activities:view' as const,
  ATTENDANCE_VIEW: 'attendance:view' as const,
  SCHEDULES_VIEW: 'schedules:view' as const,
  SAFETY_VIEW: 'safety:view' as const,
  REPORTS_VIEW: 'reports:view' as const,
  APR_MANAGE: 'apr:manage' as const,
  CHECKLIST_MANAGE: 'checklist:manage' as const,
  RELATORIO_VIEW: 'relatorio:view' as const,
  USUARIO_MANAGE: 'usuario:manage' as const,
  USERS_VIEW: 'users:view' as const,
  USERS_CREATE: 'users:create' as const,
  USERS_UPDATE: 'users:update' as const,
  USERS_DELETE: 'users:delete' as const,
  ESCALAS_VIEW: 'escalas:view' as const,
  ESCALAS_CREATE: 'escalas:create' as const,
  ESCALAS_UPDATE: 'escalas:update' as const,
  ESCALAS_DELETE: 'escalas:delete' as const,
  ESCALAS_PUBLISH: 'escalas:publish' as const,
  ELETRICISTAS_VIEW: 'eletricistas:view' as const,
  ELETRICISTAS_CREATE: 'eletricistas:create' as const,
  ELETRICISTAS_UPDATE: 'eletricistas:update' as const,
  ELETRICISTAS_DELETE: 'eletricistas:delete' as const,
  EQUIPES_VIEW: 'equipes:view' as const,
  EQUIPES_CREATE: 'equipes:create' as const,
  EQUIPES_UPDATE: 'equipes:update' as const,
  EQUIPES_DELETE: 'equipes:delete' as const,
} as const;

export const ROLES = {
  ADMIN: 'admin' as const,
  GERENTE: 'gerente' as const,
  USUARIO: 'usuario' as const,
  SUPERVISOR: 'supervisor' as const,
} as const;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.values(PERMISSIONS) as Permission[],
  gerente: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REGISTRY_VIEW,
    PERMISSIONS.SHIFTS_VIEW,
    PERMISSIONS.ACTIVITIES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.SAFETY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.APR_MANAGE,
    PERMISSIONS.CHECKLIST_MANAGE,
    PERMISSIONS.RELATORIO_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ESCALAS_CREATE,
    PERMISSIONS.ESCALAS_UPDATE,
    PERMISSIONS.ESCALAS_PUBLISH,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  supervisor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SHIFTS_VIEW,
    PERMISSIONS.ACTIVITIES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.SAFETY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.APR_MANAGE,
    PERMISSIONS.CHECKLIST_MANAGE,
    PERMISSIONS.RELATORIO_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
  usuario: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SHIFTS_VIEW,
    PERMISSIONS.ACTIVITIES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
};

export function hasPermission(
  userPermissions: UserPermissions,
  requiredPermission: Permission,
): boolean {
  if (userPermissions.isAdmin) {
    return true;
  }

  return userPermissions.permissions.includes(requiredPermission);
}

export function hasRole(userRoles: Role[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole);
}

export function getPermissionsByRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function getPermissionsByRoles(roles: Role[]): Permission[] {
  const allPermissions = new Set<Permission>();

  roles.forEach((role) => {
    const rolePermissions = getPermissionsByRole(role);
    rolePermissions.forEach((permission) => allPermissions.add(permission));
  });

  return [...allPermissions];
}
