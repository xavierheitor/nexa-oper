/**
 * Constantes Compartilhadas
 *
 * Este arquivo centraliza todas as constantes comuns utilizadas
 * em múltiplos módulos para facilitar manutenção e configuração.
 */

/**
 * Configurações de paginação (comum a todos os módulos)
 */
export const PAGINATION_CONFIG = {
  /** Limite máximo de itens por página */
  MAX_LIMIT: 100,
  /** Limite padrão de itens por página */
  DEFAULT_LIMIT: 10,
  /** Página padrão */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Configurações de auditoria (comum a todos os módulos)
 */
export const AUDIT_CONFIG = {
  /** Usuário padrão para operações do sistema */
  DEFAULT_USER: 'system',
  /** Nome padrão do usuário do sistema */
  DEFAULT_USER_NAME: 'Sistema',
  /** Roles padrão do usuário do sistema */
  DEFAULT_ROLES: ['admin'] as string[],
} as const;

/**
 * Configurações de cache (comum a todos os módulos)
 */
export const CACHE_CONFIG = {
  /** TTL padrão para cache em segundos */
  DEFAULT_TTL: 300, // 5 minutos
  /** TTL para cache de listas paginadas */
  LIST_TTL: 60, // 1 minuto
  /** TTL para cache de contagens */
  COUNT_TTL: 120, // 2 minutos
} as const;

/**
 * Configurações de validação comuns
 */
export const VALIDATION_CONFIG = {
  /** Tamanho máximo do termo de busca (comum a todos os módulos) */
  MAX_SEARCH_LENGTH: 255,
} as const;

/**
 * Configurações de ordenação comuns
 */
export const ORDER_CONFIG = {
  /** Ordenação padrão para listas paginadas (comum a todos os módulos) */
  DEFAULT_ORDER: [
    { createdAt: 'desc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para sincronização (comum a todos os módulos) */
  SYNC_ORDER: [
    { updatedAt: 'desc' as const },
    { createdAt: 'desc' as const },
    { id: 'asc' as const },
  ] as any,
} as const;

/**
 * Mensagens de erro comuns
 */
export const COMMON_ERROR_MESSAGES = {
  INVALID_PAGE: 'Página deve ser maior que 0',
  INVALID_LIMIT: `Limite deve estar entre 1 e ${PAGINATION_CONFIG.MAX_LIMIT}`,
  SEARCH_TOO_LONG: `Termo de busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
} as const;
