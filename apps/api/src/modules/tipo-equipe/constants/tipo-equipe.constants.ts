/**
 * Constantes do módulo Tipo Equipe
 *
 * Centraliza todas as constantes utilizadas no módulo de tipos de equipe,
 * incluindo configurações de ordenação, paginação, validação e mensagens de erro.
 */

/**
 * Configurações de ordenação padrão
 */
export const ORDER_CONFIG = {
  DEFAULT_ORDER_BY: 'nome',
  DEFAULT_ORDER_DIR: 'asc' as const,
  ALLOWED_ORDER_FIELDS: ['id', 'nome', 'createdAt', 'updatedAt'],
  ALLOWED_ORDER_DIRECTIONS: ['asc', 'desc'] as const,
};

/**
 * Configurações de paginação
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Configurações de busca textual
 */
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 255,
  SEARCH_FIELDS: ['nome'],
} as const;

/**
 * Configurações de validação
 */
export const VALIDATION_CONFIG = {
  NOME_MIN_LENGTH: 2,
  NOME_MAX_LENGTH: 255,
} as const;

/**
 * Mensagens de erro específicas do módulo
 */
export const ERROR_MESSAGES = {
  TIPO_EQUIPE_NOT_FOUND: 'Tipo de equipe não encontrado',
  TIPO_EQUIPE_ALREADY_EXISTS: 'Já existe um tipo de equipe com este nome',
  CANNOT_DELETE_TIPO_EQUIPE_IN_USE:
    'Não é possível excluir tipo de equipe que está sendo usado por equipes',
} as const;
