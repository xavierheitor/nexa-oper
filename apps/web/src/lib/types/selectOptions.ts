/**
 * Tipos para Opções de Select
 *
 * Este arquivo define tipos genéricos e reutilizáveis para opções
 * de componentes Select, eliminando o uso de `any` em valores.
 *
 * FUNCIONALIDADES:
 * - Tipo genérico para opções de select com type safety
 * - Suporte a valores primitivos e objetos
 * - Compatibilidade com Ant Design Select
 *
 * BENEFÍCIOS:
 * - Elimina uso de `any` em valores de select
 * - Type safety completo
 * - Reutilizável em toda aplicação
 */

/**
 * Opção de select genérica com tipo específico para o valor
 *
 * @template TValue - Tipo do valor da opção (string, number, etc.)
 */
export interface SelectOption<TValue = string | number> {
  /** Label exibido na opção */
  label: string;
  /** Valor da opção (tipado) */
  value: TValue;
  /** Se a opção está desabilitada */
  disabled?: boolean;
  /** Dados adicionais da opção */
  metadata?: unknown;
}

/**
 * Tipo para opções de select com valores string
 */
export type StringSelectOption = SelectOption<string>;

/**
 * Tipo para opções de select com valores number
 */
export type NumberSelectOption = SelectOption<number>;

/**
 * Tipo para opções de select com valores string ou number
 */
export type SelectOptionValue = string | number;

/**
 * Tipo para array de opções de select
 */
export type SelectOptions<TValue = SelectOptionValue> = Array<SelectOption<TValue>>;

