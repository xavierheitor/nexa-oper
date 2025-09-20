/**
 * Constantes do módulo Equipe
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Equipe. Constantes comuns estão em common/constants.
 */

import { ERROR_MESSAGES as SHARED_ERRORS } from '@common/constants/errors';

/**
 * Configurações de validação específicas da Equipe
 */
export const EQUIPE_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome */
  MAX_NOME_LENGTH: 255,
} as const;

/**
 * Configurações de paginação específicas da Equipe
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Configurações de ordenação específicas da Equipe
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
 * Mensagens de erro específicas da Equipe
 */
export const ERROR_MESSAGES = {
  // Mensagens específicas da equipe (sobrescrevem as compartilhadas)
  INVALID_NOME: 'Nome da equipe é obrigatório',
  NOME_DUPLICATE: 'Já existe uma equipe cadastrada com este nome',
  EQUIPE_NOT_FOUND: 'Equipe não encontrada',
  TIPO_EQUIPE_NOT_FOUND: 'Tipo de equipe informado não foi localizado',
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
} as const;

/**
 * Mensagens de erro completas (específicas + compartilhadas)
 */
export const COMPLETE_ERROR_MESSAGES = {
  ...SHARED_ERRORS,
  ...ERROR_MESSAGES,
} as const;
