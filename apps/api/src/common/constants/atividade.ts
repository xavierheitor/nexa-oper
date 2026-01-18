/**
 * Constantes do módulo Atividade
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Atividade. Constantes comuns estão em common.constants.
 */

import { ERROR_MESSAGES as SHARED_ERRORS } from './errors';

/**
 * Configurações de validação específicas da Atividade
 */
export const ATIVIDADE_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome */
  MAX_NOME_LENGTH: 255,
} as const;

/**
 * Configurações de paginação específicas da Atividade
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Configurações de ordenação específicas da Atividade
 */
export const ORDER_CONFIG = {
  DEFAULT_ORDER: {
    createdAt: 'desc' as const,
  },
  SYNC_ORDER: {
    updatedAt: 'desc' as const,
  },
} as const;

/**
 * Mensagens de erro específicas da Atividade
 */
export const ERROR_MESSAGES = {
  // Mensagens específicas da atividade (sobrescrevem as compartilhadas)
  INVALID_NOME: 'Nome da atividade é obrigatório',
  NOME_DUPLICATE: 'Já existe uma atividade cadastrada com este nome',
  ATIVIDADE_NOT_FOUND: 'Atividade não encontrada',
  TIPO_ATIVIDADE_NOT_FOUND: 'Tipo de atividade não encontrado',
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
} as const;

/**
 * Mensagens de erro completas (específicas + compartilhadas)
 */
export const COMPLETE_ERROR_MESSAGES = {
  ...SHARED_ERRORS,
  ...ERROR_MESSAGES,
} as const;
