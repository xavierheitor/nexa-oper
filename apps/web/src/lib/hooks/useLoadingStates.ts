import { useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar múltiplos estados de loading de forma organizada
 *
 * @example
 * ```typescript
 * const { loading, setLoading } = useLoadingStates({
 *   main: true,
 *   grafico: true,
 *   graficoHora: true,
 *   graficoBase: true,
 * });
 *
 * // Atualizar um estado específico
 * setLoading('main', false);
 *
 * // Verificar se algum está carregando
 * const isLoading = loading.main || loading.grafico;
 * ```
 */
export function useLoadingStates<T extends Record<string, boolean>>(
  initialState: T
) {
  // Usa useRef para manter o initialState estável e evitar recriações
  const initialStateRef = useRef(initialState);
  const [loadingStates, setLoadingStates] = useState<T>(initialStateRef.current);

  const setLoading = useCallback(
    (key: keyof T, value: boolean) => {
      setLoadingStates((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setAllLoading = useCallback((value: boolean) => {
    setLoadingStates((prev) => {
      const newState = { ...prev } as T;
      Object.keys(newState).forEach((key) => {
        newState[key as keyof T] = value as T[keyof T];
      });
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setLoadingStates({ ...initialStateRef.current });
  }, []);

  return {
    loading: loadingStates,
    setLoading,
    setAllLoading,
    reset,
  };
}

