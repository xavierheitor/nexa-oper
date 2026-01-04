/**
 * Tipos e Constantes para Sistema de Permissões
 *
 * Este arquivo define a estrutura completa do sistema de permissões da aplicação,
 * incluindo tipos específicos, constantes e funções helper para verificação.
 *
 * ESTRUTURA:
 * - Permissões baseadas em recursos e ações (ex: 'dashboard:view', 'users:create')
 * - Roles hierárquicos (ex: 'admin', 'gerente', 'usuario', 'supervisor')
 * - Verificação de permissões em componentes e rotas
 * - Middleware de permissões para rotas protegidas
 *
 * FORMATO DE PERMISSÕES:
 * - Formato: 'recurso:acao'
 * - Exemplos:
 *   - 'dashboard:view' - Visualizar dashboard
 *   - 'apr:manage' - Gerenciar APRs (criar, editar, excluir)
 *   - 'checklist:manage' - Gerenciar checklists
 *   - 'relatorio:view' - Visualizar relatórios
 *   - 'usuario:manage' - Gerenciar usuários
 *
 * ROLES DISPONÍVEIS:
 * - 'admin' - Acesso total
 * - 'gerente' - Acesso a gestão de equipes e escalas
 * - 'supervisor' - Acesso de supervisão
 * - 'usuario' - Acesso básico de visualização
 */

/**
 * Tipo para permissões específicas do sistema
 *
 * Define todas as permissões disponíveis na aplicação no formato 'recurso:acao'
 */
export type Permission =
  | 'dashboard:view'
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

/**
 * Tipo para roles de usuário
 *
 * Define os roles disponíveis no sistema
 */
export type Role = 'admin' | 'gerente' | 'usuario' | 'supervisor';

/**
 * Interface para dados de permissões do usuário
 */
export interface UserPermissions {
  /** Lista de permissões do usuário */
  permissions: Permission[];

  /** Lista de roles do usuário */
  roles: Role[];

  /** Se o usuário é administrador */
  isAdmin: boolean;
}

/**
 * Constantes de permissões
 *
 * Centraliza todas as permissões disponíveis para uso no código,
 * garantindo type safety e facilitando refatoração
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view' as const,

  // APR (Análise Preliminar de Riscos)
  APR_MANAGE: 'apr:manage' as const,

  // Checklist
  CHECKLIST_MANAGE: 'checklist:manage' as const,

  // Relatórios
  RELATORIO_VIEW: 'relatorio:view' as const,

  // Usuários
  USUARIO_MANAGE: 'usuario:manage' as const,
  USERS_VIEW: 'users:view' as const,
  USERS_CREATE: 'users:create' as const,
  USERS_UPDATE: 'users:update' as const,
  USERS_DELETE: 'users:delete' as const,

  // Escalas
  ESCALAS_VIEW: 'escalas:view' as const,
  ESCALAS_CREATE: 'escalas:create' as const,
  ESCALAS_UPDATE: 'escalas:update' as const,
  ESCALAS_DELETE: 'escalas:delete' as const,
  ESCALAS_PUBLISH: 'escalas:publish' as const,

  // Eletricistas
  ELETRICISTAS_VIEW: 'eletricistas:view' as const,
  ELETRICISTAS_CREATE: 'eletricistas:create' as const,
  ELETRICISTAS_UPDATE: 'eletricistas:update' as const,
  ELETRICISTAS_DELETE: 'eletricistas:delete' as const,

  // Equipes
  EQUIPES_VIEW: 'equipes:view' as const,
  EQUIPES_CREATE: 'equipes:create' as const,
  EQUIPES_UPDATE: 'equipes:update' as const,
  EQUIPES_DELETE: 'equipes:delete' as const,
} as const;

/**
 * Constantes de roles
 *
 * Centraliza todos os roles disponíveis no sistema
 */
export const ROLES = {
  ADMIN: 'admin' as const,
  GERENTE: 'gerente' as const,
  USUARIO: 'usuario' as const,
  SUPERVISOR: 'supervisor' as const,
} as const;

/**
 * Mapeamento de roles para permissões
 *
 * Define quais permissões cada role possui no sistema.
 * Admin possui todas as permissões, outros roles têm permissões específicas.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.values(PERMISSIONS) as Permission[],
  gerente: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.APR_MANAGE,
    PERMISSIONS.CHECKLIST_MANAGE,
    PERMISSIONS.RELATORIO_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ESCALAS_CREATE,
    PERMISSIONS.ESCALAS_UPDATE,
    PERMISSIONS.ESCALAS_PUBLISH,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
  supervisor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.APR_MANAGE,
    PERMISSIONS.CHECKLIST_MANAGE,
    PERMISSIONS.RELATORIO_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
  usuario: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
};

/**
 * Função helper para verificar permissões
 *
 * Verifica se um usuário possui uma permissão específica.
 * Usuários admin possuem todas as permissões automaticamente.
 *
 * @param userPermissions - Permissões do usuário
 * @param requiredPermission - Permissão necessária
 * @returns Se o usuário tem a permissão
 */
export function hasPermission(
  userPermissions: UserPermissions,
  requiredPermission: Permission
): boolean {
  // Se é admin, tem todas as permissões
  if (userPermissions.isAdmin) {
    return true;
  }

  // Verifica se tem a permissão específica
  return userPermissions.permissions.includes(requiredPermission);
}

/**
 * Função helper para verificar roles
 *
 * Verifica se um usuário possui um role específico.
 *
 * @param userRoles - Roles do usuário
 * @param requiredRole - Role necessária
 * @returns Se o usuário tem o role
 */
export function hasRole(userRoles: Role[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Função helper para obter permissões de um role
 *
 * Retorna todas as permissões associadas a um role específico.
 *
 * @param role - Role para buscar permissões
 * @returns Array de permissões do role
 */
export function getPermissionsByRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Função helper para obter todas as permissões de múltiplos roles
 *
 * Combina e retorna todas as permissões únicas de uma lista de roles.
 *
 * @param roles - Array de roles
 * @returns Array de permissões únicas de todos os roles
 */
export function getPermissionsByRoles(roles: Role[]): Permission[] {
  const allPermissions = new Set<Permission>();

  roles.forEach(role => {
    const rolePermissions = getPermissionsByRole(role);
    rolePermissions.forEach(permission => allPermissions.add(permission));
  });

  return Array.from(allPermissions);
}

