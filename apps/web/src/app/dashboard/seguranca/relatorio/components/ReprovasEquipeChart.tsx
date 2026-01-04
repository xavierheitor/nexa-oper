'use client';

import { Column } from '@ant-design/plots';
import { Typography } from 'antd';
import { useMemo } from 'react';

interface ReprovaPorEquipe {
  equipeId: number;
  equipeNome: string;
  quantidade: number;
}

interface ReprovasEquipeChartProps {
  data?: ReprovaPorEquipe[] | null;
  loading?: boolean;
}

const { Title } = Typography;

/**
 * Componente de Gráfico de Reprovas por Equipe
 *
 * Exibe gráfico de colunas com top 10 equipes com mais reprovas
 */
export function ReprovasEquipeChart({
  data,
  loading = false,
}: ReprovasEquipeChartProps) {
  const chartConfig = useMemo(() => {
    const dados = data ?? [];
    if (!dados || dados.length === 0) {
      return null;
    }

    // Limitar a top 10 equipes com mais reprovas
    const top10 = dados.slice(0, 10);

    return {
      data: top10.map(item => ({
        equipe: item.equipeNome,
        quantidade: item.quantidade,
      })),
      xField: 'equipe',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: { equipe: string; quantidade: number }) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
      },
      color: '#1890ff',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [data]);

  if (loading) {
    return null; // Loading é tratado no componente pai
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <Title level={4}>Top 10 Equipes com Mais Reprovas</Title>
      {chartConfig ? (
        <div style={{ height: '500px', marginTop: 16 }}>
          <Column {...chartConfig} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Typography.Text type="secondary">
            Nenhuma reprova encontrada para equipes.
          </Typography.Text>
        </div>
      )}
    </div>
  );
}

