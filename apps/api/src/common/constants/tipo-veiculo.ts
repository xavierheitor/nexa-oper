/**
 * Constantes do módulo de Tipos de Veículo
 *
 * Define valores constantes utilizados em todo o módulo,
 * incluindo configurações de ordenação, mensagens de erro
 * e limites de paginação.
 */

/**
 * Configurações de ordenação padrão para listagens
 */
export const ORDER_CONFIG = {
  DEFAULT_ORDER_BY: 'nome',
  DEFAULT_ORDER_DIR: 'asc' as const,
  ALLOWED_ORDER_FIELDS: ['id', 'nome', 'createdAt', 'updatedAt'],
} as const;

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
 * Mensagens de erro específicas do módulo
 */
export const ERROR_MESSAGES = {
  TIPO_VEICULO_NOT_FOUND: 'Tipo de veículo não encontrado',
  TIPO_VEICULO_ALREADY_EXISTS: 'Já existe um tipo de veículo com este nome',
  INVALID_TIPO_VEICULO_ID: 'ID do tipo de veículo inválido',
  NOME_REQUIRED: 'Nome do tipo de veículo é obrigatório',
  NOME_TOO_LONG: 'Nome do tipo de veículo deve ter no máximo 255 caracteres',
  NOME_TOO_SHORT: 'Nome do tipo de veículo deve ter pelo menos 2 caracteres',
  CANNOT_DELETE_TIPO_VEICULO_IN_USE:
    'Não é possível excluir tipo de veículo que está sendo utilizado',
} as const;

/**
 * Configurações de validação
 */
export const VALIDATION_CONFIG = {
  NOME_MIN_LENGTH: 2,
  NOME_MAX_LENGTH: 255,
} as const;
