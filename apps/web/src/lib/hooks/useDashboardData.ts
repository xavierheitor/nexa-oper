'use client';

import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listTurnos } from '@/lib/actions/turno/list';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { getRecursosPorBase, type RecursosPorBase } from '@/lib/actions/turno/getRecursosPorBase';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';

interface DadosGraficoTipoEquipe {
  tipo: string;
  quantidade: number;
}

interface DadosGraficoBase {
  base: string;
  tipo: string;
  quantidade: number;
}

interface TurnosData {
  turnosAbertos: number;
  totalDiarios: number;
}

/**
 * Hook para carregar todos os dados do Dashboard
 *
 * Centraliza a lógica de fetch de dados:
 * - Turnos abertos e totais do dia
 * - Gráfico por tipo de equipe
 * - Gráfico por base
 * - Recursos por base
 */
export function useDashboardData() {
  // Fetch de turnos abertos e totais do dia
  const { data: turnosData, loading: loadingTurnos, error: errorTurnos, refetch: refetchTurnos } = useDataFetch<TurnosData>(
    async () => {
      // Usa a função helper que já trata o timezone corretamente
      const { inicio, fim } = getTodayDateRange();
      // Ajusta o fim para incluir até o último milissegundo do dia
      const fimAjustado = new Date(fim);
      fimAjustado.setMilliseconds(999);

      const [resultAbertos, resultTodos] = await Promise.all([
        listTurnos({ page: 1, pageSize: 1000, status: 'ABERTO' }),
        // Buscar todos os turnos do dia (abertos e fechados) sem filtro de status
        listTurnos({ page: 1, pageSize: 1000, dataInicio: inicio, dataFim: fimAjustado }),
      ]);

      // Tratar resultado de turnos abertos
      const turnosAbertos = resultAbertos.success && resultAbertos.data
        ? (resultAbertos.data.total ?? resultAbertos.data.data?.length ?? 0)
        : 0;

      // Tratar resultado de turnos do dia (todos - abertos e fechados)
      // Usa total da paginação se disponível, senão conta o array
      const totalDiarios = resultTodos.success && resultTodos.data
        ? (resultTodos.data.total ?? resultTodos.data.data?.length ?? 0)
        : 0;

      // Debug temporário - remover depois
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Turnos do dia:', {
          inicio: inicio.toISOString(),
          fimAjustado: fimAjustado.toISOString(),
          totalDiarios,
          turnosAbertos,
          resultTodosSuccess: resultTodos.success,
          resultTodosTotal: resultTodos.data?.total,
          resultTodosDataLength: resultTodos.data?.data?.length,
        });
      }

      return {
        turnosAbertos,
        totalDiarios,
      };
    },
    []
  );

  // Fetch de gráfico por tipo de equipe
  const { data: dadosGrafico, loading: loadingGrafico, error: errorGrafico, refetch: refetchGrafico } = useDataFetch<DadosGraficoTipoEquipe[]>(
    async () => {
      const result = await getStatsByTipoEquipe();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico');
    },
    []
  );

  // Fetch de gráfico por base
  const { data: dadosGraficoBase, loading: loadingGraficoBase, error: errorGraficoBase, refetch: refetchGraficoBase } = useDataFetch<DadosGraficoBase[]>(
    async () => {
      const result = await getStatsByBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico por base');
    },
    []
  );

  // Fetch de recursos por base
  const { data: recursosPorBase, loading: loadingRecursos, error: errorRecursos, refetch: refetchRecursos } = useDataFetch<RecursosPorBase[]>(
    async () => {
      const result = await getRecursosPorBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar recursos por base');
    },
    []
  );

  return {
    // Dados
    turnosData,
    dadosGrafico,
    dadosGraficoBase,
    recursosPorBase,

    // Loading states
    loadingTurnos,
    loadingGrafico,
    loadingGraficoBase,
    loadingRecursos,
    loading: loadingTurnos || loadingGrafico || loadingGraficoBase || loadingRecursos,

    // Error states
    errorTurnos,
    errorGrafico,
    errorGraficoBase,
    errorRecursos,

    // Refetch functions
    refetchTurnos,
    refetchGrafico,
    refetchGraficoBase,
    refetchRecursos,
  };
}

