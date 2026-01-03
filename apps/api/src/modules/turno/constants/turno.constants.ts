/**
 * Constantes do módulo Turno
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Turno. Constantes comuns estão em common/constants.
 */

import { ERROR_MESSAGES as SHARED_ERRORS } from '@common/constants/errors';

/**
 * Configurações de validação específicas do Turno
 */
export const TURNO_VALIDATION_CONFIG = {
  /** Tamanho mínimo do dispositivo */
  MIN_DISPOSITIVO_LENGTH: 1,
  /** Tamanho máximo do dispositivo */
  MAX_DISPOSITIVO_LENGTH: 255,
  /** KM mínimo válido */
  MIN_KM: 0,
  /** KM máximo válido */
  MAX_KM: 999999,
} as const;

/**
 * Configurações de paginação específicas do Turno
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Configurações de ordenação específicas do Turno
 */
export const ORDER_CONFIG = {
  DEFAULT_ORDER: {
    dataSolicitacao: 'desc' as const,
  },
  SYNC_ORDER: {
    updatedAt: 'desc' as const,
  },
} as const;

/**
 * Status possíveis de um turno
 */
export const TURNO_STATUS = {
  ABERTO: 'ABERTO',
  FECHADO: 'FECHADO',
  CANCELADO: 'CANCELADO',
} as const;

/**
 * Mensagens de erro específicas do Turno
 */
export const ERROR_MESSAGES = {
  // Mensagens específicas do turno
  TURNO_NOT_FOUND: 'Turno não encontrado',
  VEICULO_NOT_FOUND: 'Veículo não encontrado',
  EQUIPE_NOT_FOUND: 'Equipe não encontrada',
  ELETRICISTA_NOT_FOUND: 'Eletricista não encontrado',
  TURNO_JA_ABERTO: 'Já existe um turno aberto para este veículo',
  TURNO_JA_ABERTO_EQUIPE: 'Já existe um turno aberto para esta equipe',
  TURNO_JA_ABERTO_ELETRICISTA:
    'Já existe um turno aberto para este eletricista',
  TURNO_JA_FECHADO: 'Turno já está fechado',
  TURNO_NAO_ABERTO: 'Turno não está aberto',
  KM_INVALIDO: 'Quilometragem inválida',
  DATA_INVALIDA: 'Data inválida',
  DISPOSITIVO_REQUIRED: 'Dispositivo é obrigatório',
  VEICULO_REQUIRED: 'Veículo é obrigatório',
  EQUIPE_REQUIRED: 'Equipe é obrigatória',
  ELETRICISTAS_REQUIRED: 'Pelo menos um eletricista é obrigatório',
  DATA_INICIO_REQUIRED: 'Data de início é obrigatória',
  KM_INICIO_REQUIRED: 'Quilometragem de início é obrigatória',
  DISPOSITIVO_TOO_SHORT: `Dispositivo deve ter pelo menos ${TURNO_VALIDATION_CONFIG.MIN_DISPOSITIVO_LENGTH} caractere`,
  DISPOSITIVO_TOO_LONG: `Dispositivo deve ter no máximo ${TURNO_VALIDATION_CONFIG.MAX_DISPOSITIVO_LENGTH} caracteres`,
  KM_TOO_LOW: `Quilometragem deve ser no mínimo ${TURNO_VALIDATION_CONFIG.MIN_KM}`,
  KM_TOO_HIGH: `Quilometragem deve ser no máximo ${TURNO_VALIDATION_CONFIG.MAX_KM}`,
} as const;

/**
 * Mensagens de erro completas (específicas + compartilhadas)
 */
export const COMPLETE_ERROR_MESSAGES = {
  ...SHARED_ERRORS,
  ...ERROR_MESSAGES,
} as const;
