/**
 * Constantes do módulo Veículo
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Veículo. Constantes comuns estão em common.constants.
 */

import { ERROR_MESSAGES as SHARED_ERRORS } from './errors';

/**
 * Configurações de validação específicas do Veículo
 */
export const VEICULO_VALIDATION_CONFIG = {
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
} as const;

/**
 * Configurações de paginação específicas do Veículo
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Configurações de ordenação específicas do Veículo
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
 * Mensagens de erro específicas do Veículo
 */
export const ERROR_MESSAGES = {
  // Mensagens específicas do veículo (sobrescrevem as compartilhadas)
  INVALID_PLACA: 'Placa do veículo é obrigatória',
  PLACA_DUPLICATE: 'Já existe um veículo cadastrado com esta placa',
  VEICULO_NOT_FOUND: 'Veículo não encontrado',
  TIPO_VEICULO_NOT_FOUND: 'Tipo de veículo informado não foi localizado',
  MODELO_TOO_SHORT: `Modelo deve ter pelo menos ${VEICULO_VALIDATION_CONFIG.MIN_MODELO_LENGTH} caractere`,
  MODELO_TOO_LONG: `Modelo deve ter no máximo ${VEICULO_VALIDATION_CONFIG.MAX_MODELO_LENGTH} caracteres`,
  ANO_INVALID_RANGE: `Ano deve estar entre ${VEICULO_VALIDATION_CONFIG.MIN_ANO} e ${VEICULO_VALIDATION_CONFIG.MAX_ANO}`,
} as const;

/**
 * Mensagens de erro completas (específicas + compartilhadas)
 */
export const COMPLETE_ERROR_MESSAGES = {
  ...SHARED_ERRORS,
  ...ERROR_MESSAGES,
} as const;
