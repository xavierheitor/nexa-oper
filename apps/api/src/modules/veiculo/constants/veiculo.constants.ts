/**
 * Constantes do módulo Veículo
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Veículo. Constantes comuns estão em shared/constants.
 */

import { COMMON_ERROR_MESSAGES } from '../../../shared/constants';

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

// Re-export das constantes compartilhadas para manter compatibilidade
export {
  PAGINATION_CONFIG,
  AUDIT_CONFIG,
  CACHE_CONFIG,
  VALIDATION_CONFIG,
} from '../../../shared/constants';

/**
 * Mensagens de erro específicas do Veículo
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'ID do veículo deve ser um número inteiro positivo',
  INVALID_PLACA: 'Placa do veículo é obrigatória',
  PLACA_DUPLICATE: 'Já existe um veículo cadastrado com esta placa',
  INVALID_TIPO_VEICULO_ID:
    'ID do tipo de veículo deve ser um número inteiro positivo',
  INVALID_CONTRATO_ID: 'ID do contrato deve ser um número inteiro positivo',
  VEICULO_NOT_FOUND: 'Veículo não encontrado',
  TIPO_VEICULO_NOT_FOUND: 'Tipo de veículo informado não foi localizado',
  CONTRATO_NOT_FOUND: 'Contrato informado não foi localizado',
  MODELO_TOO_SHORT: `Modelo deve ter pelo menos ${VEICULO_VALIDATION_CONFIG.MIN_MODELO_LENGTH} caractere`,
  MODELO_TOO_LONG: `Modelo deve ter no máximo ${VEICULO_VALIDATION_CONFIG.MAX_MODELO_LENGTH} caracteres`,
  ANO_INVALID_RANGE: `Ano deve estar entre ${VEICULO_VALIDATION_CONFIG.MIN_ANO} e ${VEICULO_VALIDATION_CONFIG.MAX_ANO}`,
  FORBIDDEN_CONTRACT:
    'Você não tem permissão para acessar veículos deste contrato',
  // Mensagens comuns
  ...COMMON_ERROR_MESSAGES,
} as const;

// Re-export das constantes compartilhadas para manter compatibilidade
export { ORDER_CONFIG } from '../../../shared/constants';
