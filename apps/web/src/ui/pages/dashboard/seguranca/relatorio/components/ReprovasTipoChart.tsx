'use client';

import { Column } from '@ant-design/plots';
import { Typography, Spin } from 'antd';
import { useMemo } from 'react';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface ReprovaPorTipoChecklist {
  tipoChecklistId: number;
  tipoChecklistNome: string;
  quantidade: number;
}

interface ReprovasTipoChartProps {
  data?: ReprovaPorTipoChecklist[] | null;
  loading?: boolean;
}

const { Title } = Typography;

/**
 * Componente de Gráfico de Reprovas por Tipo de Checklist
 *
 * Exibe gráfico de colunas com todos os tipos de checklist e suas reprovas
 */
export function ReprovasTipoChart({
  data,
  loading = false,
}: ReprovasTipoChartProps) {
  // IMPORTANTE: Todos os hooks devem ser chamados antes de qualquer return condicional
  const chartConfig = useMemo(() => {
    const dados = data ?? [];
    if (!dados || dados.length === 0) {
      return null;
    }

    // Mostrar todos os tipos de checklist (geralmente são poucos)
    return {
      data: dados.map(item => ({
        tipoChecklist: item.tipoChecklistNome,
        quantidade: item.quantidade,
      })),
      xField: 'tipoChecklist',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: { tipoChecklist: string; quantidade: number }) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
      },
      color: '#52c41a',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [data]);

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  // Renderiza loading enquanto não estiver hidratado
  if (!hydrated) {
    return (
      <div style={{ marginTop: '40px' }}>
        <Title level={4}>Reprovas por Tipo de Checklist</Title>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (loading) {
    return null; // Loading é tratado no componente pai
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <Title level={4}>Reprovas por Tipo de Checklist</Title>
      {chartConfig ? (
        <div style={{ height: '500px', marginTop: 16 }}>
          <Column {...chartConfig} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Typography.Text type="secondary">
            Nenhuma reprova encontrada para tipos de checklist.
          </Typography.Text>
        </div>
      )}
    </div>
  );
}

