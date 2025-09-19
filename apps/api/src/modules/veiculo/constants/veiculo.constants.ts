/**
 * Constantes do módulo Veículo
 *
 * Este arquivo centraliza todas as constantes utilizadas
 * no módulo Veículo para facilitar manutenção e configuração.
 */

/**
 * Configurações de paginação
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
 * Configurações de validação
 */
export const VALIDATION_CONFIG = {
  /** Tamanho mínimo da placa */
  MIN_PLACA_LENGTH: 1,
  /** Tamanho máximo da placa */
  MAX_PLACA_LENGTH: 8,
  /** Tamanho mínimo do modelo */
  MIN_MODELO_LENGTH: 1,
  /** Tamanho máximo do modelo */
  MAX_MODELO_LENGTH: 255,
  /** Ano mínimo permitido */
  MIN_ANO: 1900,
  /** Ano máximo permitido */
  MAX_ANO: new Date().getFullYear() + 1,
  /** Tamanho máximo do termo de busca */
  MAX_SEARCH_LENGTH: 255,
} as const;

/**
 * Configurações de auditoria
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
 * Configurações de cache (para futura implementação)
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
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'ID do veículo deve ser um número inteiro positivo',
  INVALID_PAGE: 'Página deve ser maior que 0',
  INVALID_LIMIT: `Limite deve estar entre 1 e ${PAGINATION_CONFIG.MAX_LIMIT}`,
  INVALID_PLACA: 'Placa do veículo é obrigatória',
  PLACA_DUPLICATE: 'Já existe um veículo cadastrado com esta placa',
  INVALID_TIPO_VEICULO_ID:
    'ID do tipo de veículo deve ser um número inteiro positivo',
  INVALID_CONTRATO_ID: 'ID do contrato deve ser um número inteiro positivo',
  VEICULO_NOT_FOUND: 'Veículo não encontrado',
  TIPO_VEICULO_NOT_FOUND: 'Tipo de veículo informado não foi localizado',
  CONTRATO_NOT_FOUND: 'Contrato informado não foi localizado',
  SEARCH_TOO_LONG: `Termo de busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  MODELO_TOO_SHORT: `Modelo deve ter pelo menos ${VALIDATION_CONFIG.MIN_MODELO_LENGTH} caractere`,
  MODELO_TOO_LONG: `Modelo deve ter no máximo ${VALIDATION_CONFIG.MAX_MODELO_LENGTH} caracteres`,
  ANO_INVALID_RANGE: `Ano deve estar entre ${VALIDATION_CONFIG.MIN_ANO} e ${VALIDATION_CONFIG.MAX_ANO}`,
  FORBIDDEN_CONTRACT:
    'Você não tem permissão para acessar veículos deste contrato',
} as const;

/**
 * Configurações de ordenação
 */
export const ORDER_CONFIG = {
  /** Ordenação padrão para listas paginadas */
  DEFAULT_ORDER: [
    { createdAt: 'desc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para sincronização */
  SYNC_ORDER: [
    { updatedAt: 'desc' as const },
    { createdAt: 'desc' as const },
    { id: 'asc' as const },
  ] as any,
} as const;
