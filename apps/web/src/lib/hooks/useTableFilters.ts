/**
 * Hook para Gerenciamento de Filtros de Tabela
 *
 * Este hook centraliza a lógica de gerenciamento de filtros em tabelas,
 * fornecendo estado, handlers e utilitários para limpar filtros.
 *
 * FUNCIONALIDADES:
 * - Gerencia estado de múltiplos filtros
 * - Fornece handler genérico para mudanças
 * - Fornece função para limpar todos os filtros
 * - Suporta valores iniciais
 * - Type safety completo
 *
 * BENEFÍCIOS:
 * - Elimina código repetitivo de gerenciamento de estado
 * - Padroniza comportamento de filtros
 * - Facilita reset de filtros
 * - Type safety garantido
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const { filters, handleFilterChange, clearFilters } = useTableFilters({
 *   veiculo: '',
 *   equipe: '',
 *   base: undefined
 * });
 *
 * // No componente
 * <Input
 *   value={filters.veiculo}
 *   onChange={(e) => handleFilterChange('veiculo', e.target.value)}
 * />
 * <Button onClick={clearFilters}>Limpar Filtros</Button>
 * ```
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Opções de configuração do hook
 */
export interface UseTableFiltersOptions<T extends Record<string, any>> {
  /**
   * Valores iniciais dos filtros
   */
  initialFilters?: Partial<T>;
}

/**
 * Retorno do hook
 */
export interface UseTableFiltersReturn<T extends Record<string, any>> {
  /**
   * Estado atual dos filtros
   */
  filters: T;

  /**
   * Handler para mudar um filtro específico
   */
  handleFilterChange: <K extends keyof T>(key: K, value: T[K]) => void;

  /**
   * Limpa todos os filtros para seus valores iniciais
   */
  clearFilters: () => void;

  /**
   * Define todos os filtros de uma vez
   */
  setFilters: (filters: Partial<T>) => void;
}

/**
 * Hook para gerenciamento de filtros de tabela
 *
 * @param initialFilters - Valores iniciais dos filtros
 * @returns Objeto com estado e handlers dos filtros
 */
export function useTableFilters<T extends Record<string, any>>(
  initialFilters: Partial<T> = {}
): UseTableFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(() => initialFilters as T);

  const handleFilterChange = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters as T);
  }, [initialFilters]);

  const setFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  return useMemo(
    () => ({
      filters,
      handleFilterChange,
      clearFilters,
      setFilters,
    }),
    [filters, handleFilterChange, clearFilters, setFilters]
  );
}

