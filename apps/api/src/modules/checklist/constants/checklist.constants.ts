/**
 * Constantes do módulo Checklist
 *
 * Este arquivo centraliza todas as constantes específicas
 * do módulo Checklist. Constantes comuns estão em shared/constants.
 */

import { COMMON_ERROR_MESSAGES } from '../../../shared/constants';

/**
 * Configurações de validação específicas do Checklist
 */
export const CHECKLIST_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome do checklist */
  MIN_NOME_LENGTH: 1,
  /** Tamanho máximo do nome do checklist */
  MAX_NOME_LENGTH: 255,
} as const;

// Re-export das constantes compartilhadas para manter compatibilidade
export { AUDIT_CONFIG, CACHE_CONFIG } from '../../../shared/constants';

/**
 * Mensagens de erro específicas do Checklist
 */
export const ERROR_MESSAGES = {
  INVALID_ID: 'ID do checklist deve ser um número inteiro positivo',
  INVALID_TIPO_CHECKLIST_ID:
    'ID do tipo de checklist deve ser um número inteiro positivo',
  CHECKLIST_NOT_FOUND: 'Checklist não encontrado',
  CHECKLIST_DUPLICATE: 'Já existe um checklist com o nome informado',
  TIPO_CHECKLIST_NOT_FOUND: 'Tipo de checklist informado não foi localizado',
  NOME_TOO_SHORT: `Nome deve ter pelo menos ${CHECKLIST_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  NOME_TOO_LONG: `Nome deve ter no máximo ${CHECKLIST_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  TIPO_CHECKLIST_REQUIRED: 'Tipo de checklist é obrigatório',
  // Mensagens comuns
  ...COMMON_ERROR_MESSAGES,
} as const;

/**
 * Configurações de ordenação específicas do Checklist
 */
export const CHECKLIST_ORDER_CONFIG = {
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

// Re-export das constantes compartilhadas para manter compatibilidade
export { ORDER_CONFIG } from '../../../shared/constants';
