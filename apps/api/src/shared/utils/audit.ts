/**
 * Utilitários de Auditoria Compartilhados
 *
 * Centraliza lógica de auditoria para garantir consistência
 * entre diferentes módulos da aplicação.
 */

/**
 * Interface para contexto de usuário
 */
export interface UserContext {
  userId: string;
  userName: string;
  roles: string[];
}

/**
 * Configurações padrão de auditoria
 */
export const AUDIT_DEFAULTS = {
  DEFAULT_USER: 'system',
  DEFAULT_USER_NAME: 'Sistema',
  DEFAULT_ROLES: ['admin'] as string[],
} as const;

/**
 * Obtém contexto padrão do usuário
 * TODO: Integrar com JWT para obter dados reais do usuário
 */
export function getDefaultUserContext(): UserContext {
  return {
    userId: AUDIT_DEFAULTS.DEFAULT_USER,
    userName: AUDIT_DEFAULTS.DEFAULT_USER_NAME,
    roles: AUDIT_DEFAULTS.DEFAULT_ROLES,
  };
}

/**
 * Cria dados de auditoria para criação
 */
export function createAuditData(userContext: UserContext) {
  return {
    createdAt: new Date(),
    createdBy: userContext.userId,
  };
}

/**
 * Cria dados de auditoria para atualização
 */
export function updateAuditData(userContext: UserContext) {
  return {
    updatedAt: new Date(),
    updatedBy: userContext.userId,
  };
}

/**
 * Cria dados de auditoria para exclusão (soft delete)
 */
export function deleteAuditData(userContext: UserContext) {
  return {
    deletedAt: new Date(),
    deletedBy: userContext.userId,
  };
}

/**
 * Cria dados de auditoria completos para criação
 */
export function createFullAuditData(userContext: UserContext) {
  return {
    ...createAuditData(userContext),
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  };
}
