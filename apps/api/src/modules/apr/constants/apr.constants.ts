/**
 * Constantes do módulo APR (Análise Preliminar de Risco)
 *
 * Este arquivo centraliza todas as constantes utilizadas
 * no módulo APR para facilitar manutenção e configuração.
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
  /** Tamanho mínimo do nome do modelo APR */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome do modelo APR */
  MAX_NOME_LENGTH: 255,
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
  INVALID_ID: 'ID do modelo APR deve ser um número inteiro positivo',
  INVALID_PAGE: 'Página deve ser maior que 0',
  INVALID_LIMIT: `Limite deve estar entre 1 e ${PAGINATION_CONFIG.MAX_LIMIT}`,
  APR_NOT_FOUND: 'Modelo APR não encontrado',
  APR_DUPLICATE: 'Já existe um modelo APR com o nome',
  SEARCH_TOO_LONG: `Termo de busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
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
  /** Ordenação para relações APR-Perguntas */
  PERGUNTA_RELACAO_ORDER: [
    { aprId: 'asc' as const },
    { ordem: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para relações APR-Opções */
  OPCAO_RELACAO_ORDER: [
    { aprId: 'asc' as const },
    { aprOpcaoRespostaId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para relações APR-TipoAtividade */
  TIPO_ATIVIDADE_RELACAO_ORDER: [
    { tipoAtividadeId: 'asc' as const },
    { aprId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
} as const;
