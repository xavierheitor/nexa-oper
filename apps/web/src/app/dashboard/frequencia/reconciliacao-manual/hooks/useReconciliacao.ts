'use client';

import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listEquipes } from '@/lib/actions/equipe/list';

interface Equipe {
  id: number;
  nome: string;
}

/**
 * Hook para carregar dados de reconciliação
 *
 * Centraliza a lógica de fetch:
 * - Lista de equipes
 */
export function useReconciliacao() {
  // Carregar equipes
  const { data: equipesData, loading: loadingEquipes } = useDataFetch<Array<{ id: number; nome: string }>>(
    async () => {
      const result = await listEquipes({ page: 1, pageSize: 1000 });
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : result.data.data;
        return data.map((e: { id: number; nome: string }) => ({ id: e.id, nome: e.nome }));
      }
      throw new Error(result.error || 'Erro ao carregar equipes');
    },
    []
  );

  return {
    equipes: equipesData ?? [],
    loadingEquipes,
  };
}

