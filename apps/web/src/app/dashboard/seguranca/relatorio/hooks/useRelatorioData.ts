'use client';

import type { Dayjs } from 'dayjs';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { getReprovasPorPergunta } from '@/lib/actions/seguranca/getReprovasPorPergunta';
import { getReprovasPorEquipe } from '@/lib/actions/seguranca/getReprovasPorEquipe';
import { getReprovasPorTipoChecklist } from '@/lib/actions/seguranca/getReprovasPorTipoChecklist';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';

interface ReprovaPorPergunta {
  perguntaId: number;
  perguntaNome: string;
  quantidade: number;
}

interface ReprovaPorEquipe {
  equipeId: number;
  equipeNome: string;
  quantidade: number;
}

interface ReprovaPorTipoChecklist {
  tipoChecklistId: number;
  tipoChecklistNome: string;
  quantidade: number;
}

/**
 * Hook para carregar todos os dados do Relatório de Segurança
 *
 * Centraliza a lógica de fetch de dados:
 * - Lista de bases
 * - Lista de tipos de equipe
 * - Reprovas por pergunta
 * - Reprovas por equipe
 * - Reprovas por tipo de checklist
 */
export function useRelatorioData(
  periodo: [Dayjs, Dayjs],
  baseId?: number,
  tipoEquipeId?: number
) {
  // Buscar lista de bases
  const { data: basesData, loading: loadingBases } = useDataFetch(
    () => unwrapFetcher(listBases)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  // Buscar lista de tipos de equipe
  const { data: tiposEquipeData, loading: loadingTiposEquipe } = useDataFetch(
    () => unwrapFetcher(listTiposEquipe)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  // Buscar dados de reprovas por pergunta
  const { data: dataPerguntas, loading: loadingPerguntas, error: errorPerguntas, refetch: refetchPerguntas } = useDataFetch<ReprovaPorPergunta[]>(
    () =>
      unwrapFetcher(getReprovasPorPergunta)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
        ...(tipoEquipeId && { tipoEquipeId }),
      }),
    [periodo, baseId, tipoEquipeId]
  );

  // Buscar dados de reprovas por equipe
  const {
    data: dataEquipes,
    loading: loadingEquipes,
    error: errorEquipes,
    refetch: refetchEquipes,
  } = useDataFetch<ReprovaPorEquipe[]>(
    () =>
      unwrapFetcher(getReprovasPorEquipe)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
        ...(tipoEquipeId && { tipoEquipeId }),
      }),
    [periodo, baseId, tipoEquipeId]
  );

  // Buscar dados de reprovas por tipo de checklist
  const {
    data: dataTiposChecklist,
    loading: loadingTiposChecklist,
    error: errorTiposChecklist,
    refetch: refetchTiposChecklist,
  } = useDataFetch<ReprovaPorTipoChecklist[]>(
    () =>
      unwrapFetcher(getReprovasPorTipoChecklist)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
        ...(tipoEquipeId && { tipoEquipeId }),
      }),
    [periodo, baseId, tipoEquipeId]
  );

  return {
    // Dados de opções
    bases: basesData ?? [],
    tiposEquipe: tiposEquipeData ?? [],

    // Dados de reprovas
    dataPerguntas,
    dataEquipes,
    dataTiposChecklist,

    // Loading states
    loadingBases,
    loadingTiposEquipe,
    loadingPerguntas,
    loadingEquipes,
    loadingTiposChecklist,
    loading: loadingPerguntas || loadingEquipes || loadingTiposChecklist,

    // Error states
    errorPerguntas,
    errorEquipes,
    errorTiposChecklist,

    // Refetch functions
    refetchPerguntas,
    refetchEquipes,
    refetchTiposChecklist,
  };
}

