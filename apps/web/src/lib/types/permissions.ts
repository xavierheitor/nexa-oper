/**
 * Tipos e Constantes para Sistema de Permissões
 *
 * Este arquivo define a estrutura básica para o sistema de permissões futuro.
 * Por enquanto, serve como documentação e preparação para implementação.
 *
 * ESTRUTURA PREVISTA:
 * - Permissões baseadas em recursos e ações (ex: 'dashboard:view', 'users:create')
 * - Roles hierárquicos (ex: 'admin', 'manager', 'user')
 * - Verificação de permissões em componentes e rotas
 * - Middleware de permissões para rotas protegidas
 *
 * FORMATO DE PERMISSÕES:
 * - Formato: 'recurso:acao'
 * - Exemplos:
 *   - 'dashboard:view' - Visualizar dashboard
 *   - 'users:create' - Criar usuários
 *   - 'users:update' - Atualizar usuários
 *   - 'users:delete' - Deletar usuários
 *   - 'escalas:view' - Visualizar escalas
 *   - 'escalas:edit' - Editar escalas
 *   - 'escalas:publish' - Publicar escalas
 *
 * ROLES PREVISTOS:
 * - 'admin' - Acesso total
 * - 'manager' - Acesso a gestão de equipes e escalas
 * - 'user' - Acesso básico de visualização
 *
 * TODO: Implementar quando o sistema de permissões for desenvolvido
 */

/**
 * Tipo para permissões no formato 'recurso:acao'
 */
export type Permission = string;

/**
 * Tipo para roles de usuário
 */
export type Role = 'admin' | 'manager' | 'user' | string;

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
 * Constantes de permissões (exemplos para referência futura)
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Usuários
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Escalas
  ESCALAS_VIEW: 'escalas:view',
  ESCALAS_CREATE: 'escalas:create',
  ESCALAS_UPDATE: 'escalas:update',
  ESCALAS_DELETE: 'escalas:delete',
  ESCALAS_PUBLISH: 'escalas:publish',

  // Eletricistas
  ELETRICISTAS_VIEW: 'eletricistas:view',
  ELETRICISTAS_CREATE: 'eletricistas:create',
  ELETRICISTAS_UPDATE: 'eletricistas:update',
  ELETRICISTAS_DELETE: 'eletricistas:delete',

  // Equipes
  EQUIPES_VIEW: 'equipes:view',
  EQUIPES_CREATE: 'equipes:create',
  EQUIPES_UPDATE: 'equipes:update',
  EQUIPES_DELETE: 'equipes:delete',

  // Relatórios
  RELATORIOS_VIEW: 'relatorios:view',
} as const;

/**
 * Constantes de roles
 */
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

/**
 * Mapeamento de roles para permissões (exemplo para futuro)
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ESCALAS_CREATE,
    PERMISSIONS.ESCALAS_UPDATE,
    PERMISSIONS.ESCALAS_PUBLISH,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
    PERMISSIONS.RELATORIOS_VIEW,
  ],
  user: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ESCALAS_VIEW,
    PERMISSIONS.ELETRICISTAS_VIEW,
    PERMISSIONS.EQUIPES_VIEW,
  ],
};

/**
 * Função helper para verificar permissões (preparado para futuro)
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
 * Função helper para verificar roles (preparado para futuro)
 *
 * @param userRoles - Roles do usuário
 * @param requiredRole - Role necessária
 * @returns Se o usuário tem o role
 */
export function hasRole(userRoles: Role[], requiredRole: Role): boolean {
  return userRoles.includes(requiredRole);
}

