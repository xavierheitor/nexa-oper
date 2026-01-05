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

/**
 * Opções de configuração do hook
 */
export interface UseSelectOptionsConfig<T = any> {
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
  transform?: (item: T) => { label: string; value: any };

  /**
   * Valor padrão a retornar quando o array estiver vazio ou undefined
   * @default []
   */
  defaultValue?: Array<{ label: string; value: any }>;
}

/**
 * Acessa valor aninhado usando dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Hook para transformar dados em opções de Select
 *
 * @param data - Array de dados a transformar
 * @param config - Configuração do hook
 * @returns Array de opções no formato { label, value }
 */
export function useSelectOptions<T = any>(
  data: T[] | undefined | null,
  config: UseSelectOptionsConfig<T> = {}
): Array<{ label: string; value: any }> {
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
    return data.map((item) => ({
      label: getNestedValue(item, labelKey) || '',
      value: getNestedValue(item, valueKey) ?? null,
    }));
  }, [data, labelKey, valueKey, transform, defaultValue]);
}

