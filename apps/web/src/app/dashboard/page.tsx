'use client';

/**
 * Página Principal do Dashboard
 *
 * Dashboard com informações consolidadas sobre:
 * - Turnos abertos no momento
 * - Turnos do dia
 * - Turnos por tipo de equipe e base
 * - Estatísticas de recursos por base (eletricistas, veículos, equipes)
 */

import React from 'react';
import { Typography, Spin } from 'antd';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import { DashboardStats } from './components/DashboardStats';
import { DashboardCharts } from './components/DashboardCharts';
import { DashboardResources } from './components/DashboardResources';
import { useDashboardData } from '@/lib/hooks/useDashboardData';

const { Title } = Typography;

export default function DashboardPage() {
  const {
    turnosData,
    dadosGrafico,
    dadosGraficoBase,
    recursosPorBase,
    loading,
    errorTurnos,
    errorGrafico,
    errorGraficoBase,
    errorRecursos,
    refetchTurnos,
    refetchGrafico,
    refetchGraficoBase,
    refetchRecursos,
  } = useDashboardData();

  // Formatar data de referência (hoje) para exibição no título
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard - {dataFormatada}</Title>

      {/* Tratamento de Erros */}
      <ErrorAlert error={errorTurnos} onRetry={refetchTurnos} />
      <ErrorAlert error={errorGrafico} onRetry={refetchGrafico} />
      <ErrorAlert error={errorGraficoBase} onRetry={refetchGraficoBase} />
      <ErrorAlert error={errorRecursos} onRetry={refetchRecursos} />

      {/* Estatísticas Principais */}
      <DashboardStats
        turnosAbertos={turnosData?.turnosAbertos}
        totalDiarios={turnosData?.totalDiarios}
        recursosPorBase={recursosPorBase}
        loading={loading}
      />

      {/* Gráficos de Turnos */}
      <DashboardCharts
        dadosGraficoTipoEquipe={dadosGrafico}
        dadosGraficoBase={dadosGraficoBase}
        loadingTipoEquipe={loading}
        loadingBase={loading}
      />

      {/* Estatísticas de Recursos por Base */}
      <DashboardResources
        recursosPorBase={recursosPorBase ?? undefined}
        loading={loading}
      />
    </div>
  );
}
