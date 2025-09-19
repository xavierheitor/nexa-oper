/**
 * Constantes do módulo Eletricista
 *
 * Centraliza configurações de validação e mensagens de erro
 * específicas do módulo responsável por gerenciar eletricistas.
 */

import { COMMON_ERROR_MESSAGES } from '../../../shared/constants';

/**
 * Configurações de validação específicas para eletricistas
 */
export const ELETRICISTA_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome */
  MAX_NOME_LENGTH: 255,
  /** Tamanho mínimo da matrícula */
  MIN_MATRICULA_LENGTH: 1,
  /** Tamanho máximo da matrícula */
  MAX_MATRICULA_LENGTH: 255,
  /** Tamanho mínimo do telefone */
  MIN_TELEFONE_LENGTH: 1,
  /** Tamanho máximo do telefone */
  MAX_TELEFONE_LENGTH: 255,
  /** Tamanho exato da UF */
  UF_LENGTH: 2,
} as const;

// Re-export das constantes compartilhadas utilizadas pelo módulo
export {
  PAGINATION_CONFIG,
  AUDIT_CONFIG,
  CACHE_CONFIG,
  VALIDATION_CONFIG,
  ORDER_CONFIG,
} from '../../../shared/constants';

/**
 * Mensagens de erro específicas do módulo
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'ID do eletricista deve ser um número inteiro positivo',
  INVALID_CONTRATO_ID: 'ID do contrato deve ser um número inteiro positivo',
  INVALID_UF_LENGTH: `Estado deve possuir ${ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH} caracteres`,
  NOME_REQUIRED: 'Nome do eletricista é obrigatório',
  MATRICULA_REQUIRED: 'Matricula do eletricista é obrigatória',
  TELEFONE_REQUIRED: 'Telefone do eletricista é obrigatório',
  CONTRATO_NOT_FOUND: 'Contrato informado não foi localizado',
  ELETRICISTA_NOT_FOUND: 'Eletricista não encontrado',
  MATRICULA_DUPLICATE: 'Já existe um eletricista cadastrado com esta matricula',
  FORBIDDEN_CONTRACT:
    'Você não tem permissão para acessar eletricistas deste contrato',
  // Mensagens comuns
  ...COMMON_ERROR_MESSAGES,
} as const;
