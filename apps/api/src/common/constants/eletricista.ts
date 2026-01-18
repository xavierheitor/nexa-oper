/**
 * Constantes do módulo Eletricista
 *
 * Centraliza configurações de validação e mensagens de erro
 * específicas do módulo responsável por gerenciar eletricistas.
 */

import { ERROR_MESSAGES as SHARED_ERRORS } from './errors';

/**
 * Configurações de validação específicas para eletricistas
 */
export const ELETRICISTA_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome */
  MAX_NOME_LENGTH: 255,
  /** Tamanho mínimo da matrícula */
  MIN_MATRICULA_LENGTH: 3,
  /** Tamanho máximo da matrícula */
  MAX_MATRICULA_LENGTH: 20,
  /** Tamanho mínimo do telefone */
  MIN_TELEFONE_LENGTH: 1,
  /** Tamanho máximo do telefone */
  MAX_TELEFONE_LENGTH: 255,
  /** Tamanho exato da UF */
  UF_LENGTH: 2,
  /** Estados válidos */
  VALID_ESTADOS: [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ],
} as const;

/**
 * Configurações de paginação específicas do Eletricista
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Configurações de ordenação específicas do Eletricista
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
 * Mensagens de erro específicas do módulo
 */
export const ERROR_MESSAGES = {
  // Mensagens específicas do eletricista (sobrescrevem as compartilhadas)
  MATRICULA_DUPLICATE: 'Já existe um eletricista cadastrado com esta matrícula',
  ELETRICISTA_NOT_FOUND: 'Eletricista não encontrado',
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${ELETRICISTA_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${ELETRICISTA_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  MATRICULA_TOO_SHORT: `Matrícula deve ter pelo menos ${ELETRICISTA_VALIDATION_CONFIG.MIN_MATRICULA_LENGTH} caracteres`,
  MATRICULA_TOO_LONG: `Matrícula deve ter no máximo ${ELETRICISTA_VALIDATION_CONFIG.MAX_MATRICULA_LENGTH} caracteres`,
} as const;

/**
 * Mensagens de erro completas (específicas + compartilhadas)
 */
export const COMPLETE_ERROR_MESSAGES = {
  ...SHARED_ERRORS,
  ...ERROR_MESSAGES,
} as const;
