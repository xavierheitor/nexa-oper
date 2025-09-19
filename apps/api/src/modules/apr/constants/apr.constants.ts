/**
 * Constantes do módulo APR (Análise Preliminar de Risco)
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo APR. Constantes comuns estão em shared/constants.
 */

import { COMMON_ERROR_MESSAGES } from '../../../shared/constants';

/**
 * Configurações de validação específicas do APR
 */
export const APR_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome do modelo APR */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome do modelo APR */
  MAX_NOME_LENGTH: 255,
} as const;

// Re-export das constantes compartilhadas para manter compatibilidade
export { AUDIT_CONFIG, CACHE_CONFIG } from '../../../shared/constants';

/**
 * Mensagens de erro específicas do APR
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'ID do modelo APR deve ser um número inteiro positivo',
  APR_NOT_FOUND: 'Modelo APR não encontrado',
  APR_DUPLICATE: 'Já existe um modelo APR com o nome',
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${APR_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${APR_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  // Mensagens comuns
  ...COMMON_ERROR_MESSAGES,
} as const;

/**
 * Configurações de ordenação específicas do APR
 */
export const APR_ORDER_CONFIG = {
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

// Re-export das constantes compartilhadas para manter compatibilidade
export { ORDER_CONFIG } from '../../../shared/constants';
