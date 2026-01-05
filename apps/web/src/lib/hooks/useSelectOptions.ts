/**
 * Hook para Transformar Dados em Opções de Select
 *
 * Este hook transforma arrays de dados em opções formatadas para componentes Select
 * do Ant Design, eliminando código repetitivo de mapeamento.
 *
 * FUNCIONALIDADES:
 * - Transforma arrays em formato { label, value }
 * - Suporta chaves customizadas para label e value
 * - Suporta função de transformação customizada
 * - Memoiza o resultado automaticamente
 * - Trata arrays vazios e undefined/null
 *
 * BENEFÍCIOS:
 * - Elimina código repetitivo de mapeamento
 * - Garante consistência nas opções de Select
 * - Memoização automática para performance
 * - Type safety completo
 *
 * EXEMPLO DE USO BÁSICO:
 * ```typescript
 * const contratosOptions = useSelectOptions(contratos, {
 *   labelKey: 'nome',
 *   valueKey: 'id'
 * });
 * ```
 *
 * EXEMPLO COM TRANSFORMAÇÃO CUSTOMIZADA:
 * ```typescript
 * const basesOptions = useSelectOptions(bases, {
 *   transform: (base) => ({
 *     label: `${base.nome} (${base.contrato?.nome || 'Sem contrato'})`,
 *     value: base.id
 *   })
 * });
 * ```
 *
 * EXEMPLO COM CHAVES ANINHADAS:
 * ```typescript
 * const equipesOptions = useSelectOptions(equipes, {
 *   labelKey: 'equipe.nome',
 *   valueKey: 'id'
 * });
 * ```
 */

'use client';

import { useMemo } from 'react';
import type { SelectOption, SelectOptionValue } from '../types/selectOptions';

/**
 * Opções de configuração do hook
 *
 * @template T - Tipo do item no array de dados
 * @template TValue - Tipo do valor da opção (inferido automaticamente ou pode ser especificado)
 */
export interface UseSelectOptionsConfig<T = unknown, TValue extends SelectOptionValue = SelectOptionValue> {
  /**
   * Chave do objeto para usar como label
   * Pode ser uma chave aninhada usando dot notation (ex: 'contrato.nome')
   */
  labelKey?: string;

  /**
   * Chave do objeto para usar como value
   */
  valueKey?: string;

  /**
   * Função de transformação customizada
   * Se fornecida, labelKey e valueKey são ignorados
   */
  transform?: (item: T) => SelectOption<TValue>;

  /**
   * Valor padrão a retornar quando o array estiver vazio ou undefined
   * @default []
   */
  defaultValue?: SelectOption<TValue>[];
}

/**
 * Acessa valor aninhado usando dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Hook para transformar dados em opções de Select
 *
 * @param data - Array de dados a transformar
 * @param config - Configuração do hook
 * @returns Array de opções no formato { label, value }
 */
export function useSelectOptions<T = unknown, TValue extends SelectOptionValue = SelectOptionValue>(
  data: T[] | undefined | null,
  config: UseSelectOptionsConfig<T, TValue> = {}
): SelectOption<TValue>[] {
  const { labelKey = 'nome', valueKey = 'id', transform, defaultValue = [] } = config;

  return useMemo(() => {
    // Retorna valor padrão se dados não existirem ou estiverem vazios
    if (!data || data.length === 0) {
      return defaultValue;
    }

    // Se há função de transformação customizada, usa ela
    if (transform) {
      return data.map(transform);
    }

    // Transforma usando chaves configuradas
    return data.map((item) => {
      const labelValue = getNestedValue(item, labelKey);
      const valueValue = getNestedValue(item, valueKey);
      return {
        label: String(labelValue || ''),
        value: (valueValue ?? null) as TValue,
      };
    });
  }, [data, labelKey, valueKey, transform, defaultValue]);
}

