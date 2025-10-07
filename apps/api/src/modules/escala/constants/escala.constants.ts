/**
 * Constantes e configurações utilizadas em todo o módulo de Escalas.
 *
 * A proposta deste arquivo é centralizar limites, mensagens e nomes de
 * recursos para manter a consistência entre controllers, services e DTOs. A
 * documentação detalhada ajuda futuros contribuidores a entender rapidamente
 * os valores de referência adotados pela operação.
 */
export const ESCALA_PAGINATION_CONFIG = {
  /** Número padrão de itens por página quando o cliente não informa um valor. */
  DEFAULT_LIMIT: 10,
  /** Página inicial padrão. */
  DEFAULT_PAGE: 1,
  /** Limite máximo aceito para evitar consultas custosas. */
  MAX_LIMIT: 50,
} as const;

export const ESCALA_VALIDATION_CONFIG = {
  /** Tamanho mínimo do nome da escala. */
  MIN_NOME_LENGTH: 3,
  /** Tamanho máximo do nome da escala. */
  MAX_NOME_LENGTH: 120,
  /** Valor mínimo aceitável para dias que compõem o ciclo. */
  MIN_DIAS_CICLO: 1,
  /** Valor máximo aceitável para dias que compõem o ciclo (duas semanas). */
  MAX_DIAS_CICLO: 31,
  /** Quantidade mínima de eletricistas em qualquer turno. */
  MIN_ELETRICISTAS: 1,
  /** Quantidade máxima padrão de eletricistas em um turno. */
  MAX_ELETRICISTAS: 10,
} as const;

export const ESCALA_ERROR_MESSAGES = {
  /** Utilizada quando o registro solicitado não é encontrado. */
  NOT_FOUND: 'Escala não encontrada',
  /** Mensagem padrão para operações que exigem escala ativa. */
  INATIVA: 'Escala está inativa e não aceita novas alocações',
  /** Mensagem emitida quando há tentativa de sobrescrever um nome existente no mesmo contrato. */
  DUPLICATED_NAME: 'Já existe uma escala com este nome para o contrato informado',
  /** Erro lançado ao tentar atribuir menos eletricistas do que o mínimo necessário. */
  INVALID_ASSIGNMENT: 'Quantidade de eletricistas atribuída é insuficiente para este horário',
} as const;

export const ESCALA_ORDER_CONFIG = {
  /** Ordenação padrão das listagens. */
  DEFAULT: [
    { createdAt: 'desc' as const },
    { nome: 'asc' as const },
  ],
};

/**
 * Número máximo de dias que a API permite gerar em um único relatório de agenda.
 * Valor escolhido para equilibrar performance e utilidade prática no campo.
 */
export const ESCALA_AGENDA_MAX_DIAS = 60;
