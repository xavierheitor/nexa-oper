/**
 * Constantes do módulo Checklist
 *
 * Este arquivo centraliza todas as constantes utilizadas
 * no módulo Checklist para facilitar manutenção e configuração.
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
  /** Tamanho mínimo do nome do checklist */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome do checklist */
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
  INVALID_ID: 'ID do checklist deve ser um número inteiro positivo',
  INVALID_TIPO_CHECKLIST_ID:
    'ID do tipo de checklist deve ser um número inteiro positivo',
  INVALID_PAGE: 'Página deve ser maior que 0',
  INVALID_LIMIT: `Limite deve estar entre 1 e ${PAGINATION_CONFIG.MAX_LIMIT}`,
  CHECKLIST_NOT_FOUND: 'Checklist não encontrado',
  CHECKLIST_DUPLICATE: 'Já existe um checklist com o nome informado',
  TIPO_CHECKLIST_NOT_FOUND: 'Tipo de checklist informado não foi localizado',
  SEARCH_TOO_LONG: `Termo de busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  TIPO_CHECKLIST_REQUIRED: 'Tipo de checklist é obrigatório',
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
  /** Ordenação para relações Checklist-Perguntas */
  PERGUNTA_RELACAO_ORDER: [
    { checklistId: 'asc' as const },
    { checklistPerguntaId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para relações Checklist-Opções */
  OPCAO_RELACAO_ORDER: [
    { checklistId: 'asc' as const },
    { checklistOpcaoRespostaId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para relações Checklist-TipoVeiculo */
  TIPO_VEICULO_RELACAO_ORDER: [
    { tipoVeiculoId: 'asc' as const },
    { checklistId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
  /** Ordenação para relações Checklist-TipoEquipe */
  TIPO_EQUIPE_RELACAO_ORDER: [
    { tipoEquipeId: 'asc' as const },
    { checklistId: 'asc' as const },
    { id: 'asc' as const },
  ] as any,
} as const;
