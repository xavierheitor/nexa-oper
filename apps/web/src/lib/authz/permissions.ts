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

export interface PermissionCatalogItem {
  permission: Permission;
  label: string;
  group: string;
  description: string;
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

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  registry: 'Cadastros',
  shifts: 'Turnos',
  activities: 'Atividades',
  attendance: 'Frequência',
  schedules: 'Escalas',
  safety: 'Segurança',
  reports: 'Relatórios',
  apr: 'APR',
  checklist: 'Checklist',
  users: 'Usuários',
  teams: 'Equipes',
  electricians: 'Eletricistas',
};

export const PERMISSION_CATALOG: PermissionCatalogItem[] = [
  {
    permission: PERMISSIONS.DASHBOARD_VIEW,
    label: 'Ver dashboard',
    group: PERMISSION_GROUP_LABELS.dashboard,
    description: 'Acessa a página inicial do dashboard.',
  },
  {
    permission: PERMISSIONS.REGISTRY_VIEW,
    label: 'Ver cadastros',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa o módulo de cadastros.',
  },
  {
    permission: PERMISSIONS.SHIFTS_VIEW,
    label: 'Ver turnos',
    group: PERMISSION_GROUP_LABELS.shifts,
    description: 'Acessa o módulo de turnos.',
  },
  {
    permission: PERMISSIONS.ACTIVITIES_VIEW,
    label: 'Ver atividades',
    group: PERMISSION_GROUP_LABELS.activities,
    description: 'Acessa o módulo de atividades.',
  },
  {
    permission: PERMISSIONS.ATTENDANCE_VIEW,
    label: 'Ver frequência',
    group: PERMISSION_GROUP_LABELS.attendance,
    description: 'Acessa o módulo de frequência.',
  },
  {
    permission: PERMISSIONS.SCHEDULES_VIEW,
    label: 'Ver escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Acessa o módulo de escalas.',
  },
  {
    permission: PERMISSIONS.SAFETY_VIEW,
    label: 'Ver segurança',
    group: PERMISSION_GROUP_LABELS.safety,
    description: 'Acessa o módulo de segurança.',
  },
  {
    permission: PERMISSIONS.REPORTS_VIEW,
    label: 'Ver relatórios',
    group: PERMISSION_GROUP_LABELS.reports,
    description: 'Acessa o módulo de relatórios.',
  },
  {
    permission: PERMISSIONS.APR_MANAGE,
    label: 'Gerenciar APR',
    group: PERMISSION_GROUP_LABELS.apr,
    description: 'Administra recursos de APR.',
  },
  {
    permission: PERMISSIONS.CHECKLIST_MANAGE,
    label: 'Gerenciar checklist',
    group: PERMISSION_GROUP_LABELS.checklist,
    description: 'Administra recursos de checklist.',
  },
  {
    permission: PERMISSIONS.RELATORIO_VIEW,
    label: 'Ver relatório de segurança',
    group: PERMISSION_GROUP_LABELS.safety,
    description: 'Acessa relatórios do módulo de segurança.',
  },
  {
    permission: PERMISSIONS.USUARIO_MANAGE,
    label: 'Gerenciar usuários',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Concede acesso administrativo geral aos usuários web.',
  },
  {
    permission: PERMISSIONS.USERS_VIEW,
    label: 'Listar usuários',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Visualiza usuários web.',
  },
  {
    permission: PERMISSIONS.USERS_CREATE,
    label: 'Criar usuários',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Cria usuários web.',
  },
  {
    permission: PERMISSIONS.USERS_UPDATE,
    label: 'Editar usuários',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Edita usuários web e suas permissões.',
  },
  {
    permission: PERMISSIONS.USERS_DELETE,
    label: 'Excluir usuários',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Exclui usuários web.',
  },
  {
    permission: PERMISSIONS.ESCALAS_VIEW,
    label: 'Ver catálogo de escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Visualiza recursos de escalas.',
  },
  {
    permission: PERMISSIONS.ESCALAS_CREATE,
    label: 'Criar escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Cria escalas e itens relacionados.',
  },
  {
    permission: PERMISSIONS.ESCALAS_UPDATE,
    label: 'Editar escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Edita escalas e itens relacionados.',
  },
  {
    permission: PERMISSIONS.ESCALAS_DELETE,
    label: 'Excluir escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Exclui escalas e itens relacionados.',
  },
  {
    permission: PERMISSIONS.ESCALAS_PUBLISH,
    label: 'Publicar escalas',
    group: PERMISSION_GROUP_LABELS.schedules,
    description: 'Publica escalas para operação.',
  },
  {
    permission: PERMISSIONS.ELETRICISTAS_VIEW,
    label: 'Ver eletricistas',
    group: PERMISSION_GROUP_LABELS.electricians,
    description: 'Visualiza eletricistas.',
  },
  {
    permission: PERMISSIONS.ELETRICISTAS_CREATE,
    label: 'Criar eletricistas',
    group: PERMISSION_GROUP_LABELS.electricians,
    description: 'Cria eletricistas.',
  },
  {
    permission: PERMISSIONS.ELETRICISTAS_UPDATE,
    label: 'Editar eletricistas',
    group: PERMISSION_GROUP_LABELS.electricians,
    description: 'Edita eletricistas.',
  },
  {
    permission: PERMISSIONS.ELETRICISTAS_DELETE,
    label: 'Excluir eletricistas',
    group: PERMISSION_GROUP_LABELS.electricians,
    description: 'Exclui eletricistas.',
  },
  {
    permission: PERMISSIONS.EQUIPES_VIEW,
    label: 'Ver equipes',
    group: PERMISSION_GROUP_LABELS.teams,
    description: 'Visualiza equipes.',
  },
  {
    permission: PERMISSIONS.EQUIPES_CREATE,
    label: 'Criar equipes',
    group: PERMISSION_GROUP_LABELS.teams,
    description: 'Cria equipes.',
  },
  {
    permission: PERMISSIONS.EQUIPES_UPDATE,
    label: 'Editar equipes',
    group: PERMISSION_GROUP_LABELS.teams,
    description: 'Edita equipes.',
  },
  {
    permission: PERMISSIONS.EQUIPES_DELETE,
    label: 'Excluir equipes',
    group: PERMISSION_GROUP_LABELS.teams,
    description: 'Exclui equipes.',
  },
];

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

  return Array.from(allPermissions);
}

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.includes(value as Permission);
}

export function normalizeRoleName(value: string): Role | null {
  const normalized = value.trim().toLowerCase();

  if ((Object.values(ROLES) as string[]).includes(normalized)) {
    return normalized as Role;
  }

  return null;
}

export function normalizeRoles(values: string[]): Role[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeRoleName(value))
        .filter((value): value is Role => value != null),
    ),
  );
}

export function resolveEffectivePermissions(
  roles: Role[],
  directPermissions: readonly string[] = [],
): Permission[] {
  const resolved = new Set<Permission>(getPermissionsByRoles(roles));

  directPermissions.forEach((permission) => {
    if (isPermission(permission)) {
      resolved.add(permission);
    }
  });

  return Array.from(resolved);
}
