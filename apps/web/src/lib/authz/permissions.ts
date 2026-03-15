export type Permission =
  | 'dashboard:view'
  | 'registry:view'
  | 'contratos:view'
  | 'contratos:create'
  | 'contratos:update'
  | 'contratos:delete'
  | 'tipos-escala:view'
  | 'horarios-equipe:view'
  | 'tipos-equipe:view'
  | 'tipos-veiculo:view'
  | 'veiculos:view'
  | 'veiculos:create'
  | 'veiculos:update'
  | 'veiculos:delete'
  | 'cargos:view'
  | 'supervisores:view'
  | 'bases:view'
  | 'tipos-justificativa:view'
  | 'tipos-atividade:view'
  | 'subtipos-atividade:view'
  | 'materiais-catalogo:view'
  | 'causas-improdutivas:view'
  | 'formularios-atividade:view'
  | 'formularios-atividade-pergunta:view'
  | 'apr-perguntas:view'
  | 'apr-opcoes:view'
  | 'apr-grupos:view'
  | 'apr-modelos:view'
  | 'checklist-tipos:view'
  | 'checklist-perguntas:view'
  | 'checklist-opcoes:view'
  | 'checklist-modelos:view'
  | 'mobile-users:view'
  | 'mobile-users:create'
  | 'mobile-users:update'
  | 'mobile-users:delete'
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
  CONTRATOS_VIEW: 'contratos:view' as const,
  CONTRATOS_CREATE: 'contratos:create' as const,
  CONTRATOS_UPDATE: 'contratos:update' as const,
  CONTRATOS_DELETE: 'contratos:delete' as const,
  TIPOS_ESCALA_VIEW: 'tipos-escala:view' as const,
  HORARIOS_EQUIPE_VIEW: 'horarios-equipe:view' as const,
  TIPOS_EQUIPE_VIEW: 'tipos-equipe:view' as const,
  TIPOS_VEICULO_VIEW: 'tipos-veiculo:view' as const,
  VEICULOS_VIEW: 'veiculos:view' as const,
  VEICULOS_CREATE: 'veiculos:create' as const,
  VEICULOS_UPDATE: 'veiculos:update' as const,
  VEICULOS_DELETE: 'veiculos:delete' as const,
  CARGOS_VIEW: 'cargos:view' as const,
  SUPERVISORES_VIEW: 'supervisores:view' as const,
  BASES_VIEW: 'bases:view' as const,
  TIPOS_JUSTIFICATIVA_VIEW: 'tipos-justificativa:view' as const,
  TIPOS_ATIVIDADE_VIEW: 'tipos-atividade:view' as const,
  SUBTIPOS_ATIVIDADE_VIEW: 'subtipos-atividade:view' as const,
  MATERIAIS_CATALOGO_VIEW: 'materiais-catalogo:view' as const,
  CAUSAS_IMPRODUTIVAS_VIEW: 'causas-improdutivas:view' as const,
  FORMULARIOS_ATIVIDADE_VIEW: 'formularios-atividade:view' as const,
  FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW:
    'formularios-atividade-pergunta:view' as const,
  APR_PERGUNTAS_VIEW: 'apr-perguntas:view' as const,
  APR_OPCOES_VIEW: 'apr-opcoes:view' as const,
  APR_GRUPOS_VIEW: 'apr-grupos:view' as const,
  APR_MODELOS_VIEW: 'apr-modelos:view' as const,
  CHECKLIST_TIPOS_VIEW: 'checklist-tipos:view' as const,
  CHECKLIST_PERGUNTAS_VIEW: 'checklist-perguntas:view' as const,
  CHECKLIST_OPCOES_VIEW: 'checklist-opcoes:view' as const,
  CHECKLIST_MODELOS_VIEW: 'checklist-modelos:view' as const,
  MOBILE_USERS_VIEW: 'mobile-users:view' as const,
  MOBILE_USERS_CREATE: 'mobile-users:create' as const,
  MOBILE_USERS_UPDATE: 'mobile-users:update' as const,
  MOBILE_USERS_DELETE: 'mobile-users:delete' as const,
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
    permission: PERMISSIONS.CONTRATOS_VIEW,
    label: 'Ver contratos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de contratos.',
  },
  {
    permission: PERMISSIONS.CONTRATOS_CREATE,
    label: 'Criar contratos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Cria contratos.',
  },
  {
    permission: PERMISSIONS.CONTRATOS_UPDATE,
    label: 'Editar contratos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Edita contratos.',
  },
  {
    permission: PERMISSIONS.CONTRATOS_DELETE,
    label: 'Excluir contratos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Exclui contratos.',
  },
  {
    permission: PERMISSIONS.TIPOS_ESCALA_VIEW,
    label: 'Ver tipos de escala',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de escala.',
  },
  {
    permission: PERMISSIONS.HORARIOS_EQUIPE_VIEW,
    label: 'Ver catálogo de horários',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de catálogo de horários.',
  },
  {
    permission: PERMISSIONS.TIPOS_EQUIPE_VIEW,
    label: 'Ver tipos de equipe',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de equipe.',
  },
  {
    permission: PERMISSIONS.TIPOS_VEICULO_VIEW,
    label: 'Ver tipos de veículo',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de veículo.',
  },
  {
    permission: PERMISSIONS.VEICULOS_VIEW,
    label: 'Ver veículos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de veículos.',
  },
  {
    permission: PERMISSIONS.VEICULOS_CREATE,
    label: 'Criar veículos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Cria veículos.',
  },
  {
    permission: PERMISSIONS.VEICULOS_UPDATE,
    label: 'Editar veículos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Edita veículos e transferências.',
  },
  {
    permission: PERMISSIONS.VEICULOS_DELETE,
    label: 'Excluir veículos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Exclui veículos.',
  },
  {
    permission: PERMISSIONS.CARGOS_VIEW,
    label: 'Ver cargos',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de cargos.',
  },
  {
    permission: PERMISSIONS.SUPERVISORES_VIEW,
    label: 'Ver supervisores',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de supervisores.',
  },
  {
    permission: PERMISSIONS.BASES_VIEW,
    label: 'Ver bases',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de bases.',
  },
  {
    permission: PERMISSIONS.TIPOS_JUSTIFICATIVA_VIEW,
    label: 'Ver tipos de justificativa',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de justificativa.',
  },
  {
    permission: PERMISSIONS.TIPOS_ATIVIDADE_VIEW,
    label: 'Ver tipos de atividade',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de atividade.',
  },
  {
    permission: PERMISSIONS.SUBTIPOS_ATIVIDADE_VIEW,
    label: 'Ver subtipos de atividade',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de subtipos de atividade.',
  },
  {
    permission: PERMISSIONS.MATERIAIS_CATALOGO_VIEW,
    label: 'Ver materiais',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de materiais.',
  },
  {
    permission: PERMISSIONS.CAUSAS_IMPRODUTIVAS_VIEW,
    label: 'Ver causas improdutivas',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de causas improdutivas.',
  },
  {
    permission: PERMISSIONS.FORMULARIOS_ATIVIDADE_VIEW,
    label: 'Ver formulários de atividade',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de formulários de atividade.',
  },
  {
    permission: PERMISSIONS.FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW,
    label: 'Ver perguntas de formulário',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de perguntas de formulário de atividade.',
  },
  {
    permission: PERMISSIONS.APR_PERGUNTAS_VIEW,
    label: 'Ver perguntas APR',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de perguntas APR.',
  },
  {
    permission: PERMISSIONS.APR_OPCOES_VIEW,
    label: 'Ver opções APR',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de opções de resposta APR.',
  },
  {
    permission: PERMISSIONS.APR_GRUPOS_VIEW,
    label: 'Ver grupos APR',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de grupos de perguntas APR.',
  },
  {
    permission: PERMISSIONS.APR_MODELOS_VIEW,
    label: 'Ver modelos APR',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de modelos APR.',
  },
  {
    permission: PERMISSIONS.CHECKLIST_TIPOS_VIEW,
    label: 'Ver tipos de checklist',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de tipos de checklist.',
  },
  {
    permission: PERMISSIONS.CHECKLIST_PERGUNTAS_VIEW,
    label: 'Ver perguntas de checklist',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de perguntas de checklist.',
  },
  {
    permission: PERMISSIONS.CHECKLIST_OPCOES_VIEW,
    label: 'Ver opções de checklist',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de opções de checklist.',
  },
  {
    permission: PERMISSIONS.CHECKLIST_MODELOS_VIEW,
    label: 'Ver modelos de checklist',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de modelos de checklist.',
  },
  {
    permission: PERMISSIONS.MOBILE_USERS_VIEW,
    label: 'Ver usuários móveis',
    group: PERMISSION_GROUP_LABELS.registry,
    description: 'Acessa a tela de usuários móveis.',
  },
  {
    permission: PERMISSIONS.MOBILE_USERS_CREATE,
    label: 'Criar usuários móveis',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Cria usuários móveis.',
  },
  {
    permission: PERMISSIONS.MOBILE_USERS_UPDATE,
    label: 'Editar usuários móveis',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Edita usuários móveis e suas permissões por contrato.',
  },
  {
    permission: PERMISSIONS.MOBILE_USERS_DELETE,
    label: 'Excluir usuários móveis',
    group: PERMISSION_GROUP_LABELS.users,
    description: 'Exclui usuários móveis.',
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
    PERMISSIONS.CONTRATOS_VIEW,
    PERMISSIONS.CONTRATOS_CREATE,
    PERMISSIONS.CONTRATOS_UPDATE,
    PERMISSIONS.CONTRATOS_DELETE,
    PERMISSIONS.TIPOS_ESCALA_VIEW,
    PERMISSIONS.HORARIOS_EQUIPE_VIEW,
    PERMISSIONS.TIPOS_EQUIPE_VIEW,
    PERMISSIONS.TIPOS_VEICULO_VIEW,
    PERMISSIONS.VEICULOS_VIEW,
    PERMISSIONS.VEICULOS_CREATE,
    PERMISSIONS.VEICULOS_UPDATE,
    PERMISSIONS.VEICULOS_DELETE,
    PERMISSIONS.CARGOS_VIEW,
    PERMISSIONS.SUPERVISORES_VIEW,
    PERMISSIONS.BASES_VIEW,
    PERMISSIONS.TIPOS_JUSTIFICATIVA_VIEW,
    PERMISSIONS.TIPOS_ATIVIDADE_VIEW,
    PERMISSIONS.SUBTIPOS_ATIVIDADE_VIEW,
    PERMISSIONS.MATERIAIS_CATALOGO_VIEW,
    PERMISSIONS.CAUSAS_IMPRODUTIVAS_VIEW,
    PERMISSIONS.FORMULARIOS_ATIVIDADE_VIEW,
    PERMISSIONS.FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW,
    PERMISSIONS.APR_PERGUNTAS_VIEW,
    PERMISSIONS.APR_OPCOES_VIEW,
    PERMISSIONS.APR_GRUPOS_VIEW,
    PERMISSIONS.APR_MODELOS_VIEW,
    PERMISSIONS.CHECKLIST_TIPOS_VIEW,
    PERMISSIONS.CHECKLIST_PERGUNTAS_VIEW,
    PERMISSIONS.CHECKLIST_OPCOES_VIEW,
    PERMISSIONS.CHECKLIST_MODELOS_VIEW,
    PERMISSIONS.MOBILE_USERS_VIEW,
    PERMISSIONS.MOBILE_USERS_CREATE,
    PERMISSIONS.MOBILE_USERS_UPDATE,
    PERMISSIONS.MOBILE_USERS_DELETE,
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
    PERMISSIONS.ELETRICISTAS_CREATE,
    PERMISSIONS.ELETRICISTAS_UPDATE,
    PERMISSIONS.ELETRICISTAS_DELETE,
    PERMISSIONS.EQUIPES_VIEW,
    PERMISSIONS.EQUIPES_CREATE,
    PERMISSIONS.EQUIPES_UPDATE,
    PERMISSIONS.EQUIPES_DELETE,
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
