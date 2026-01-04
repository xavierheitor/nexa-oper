'use client';

import { Column } from '@ant-design/plots';
import { Typography } from 'antd';
import { useMemo } from 'react';
import dayjs from 'dayjs';

interface ReprovaPorPergunta {
  perguntaId: number;
  perguntaNome: string;
  quantidade: number;
}

interface ReprovasPerguntaChartProps {
  data?: ReprovaPorPergunta[] | null;
  loading?: boolean;
  periodo: [dayjs.Dayjs, dayjs.Dayjs];
}

const { Title, Text } = Typography;

/**
 * Componente de Gráfico de Reprovas por Pergunta
 *
 * Exibe gráfico de colunas com top 10 perguntas com mais reprovas
 */
export function ReprovasPerguntaChart({
  data,
  loading = false,
  periodo,
}: ReprovasPerguntaChartProps) {
  const chartConfig = useMemo(() => {
    const dados = data ?? [];
    if (!dados || dados.length === 0) {
      return null;
    }

    // Limitar a top 10 perguntas com mais reprovas
    const top10 = dados.slice(0, 10);

    return {
      data: top10.map(item => ({
        pergunta: item.perguntaNome.length > 50
          ? `${item.perguntaNome.substring(0, 50)}...`
          : item.perguntaNome,
        quantidade: item.quantidade,
        perguntaCompleta: item.perguntaNome,
      })),
      xField: 'pergunta',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: { pergunta: string; quantidade: number; perguntaCompleta: string }) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
        customContent: (title: string, items: Array<{ name: string; value: string }>) => {
          if (!items || items.length === 0) return '';
          const item = items[0];
          const dataItem = top10.find(d =>
            (d.perguntaNome.length > 50
              ? `${d.perguntaNome.substring(0, 50)}...`
              : d.perguntaNome) === item.name
          );
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${dataItem?.perguntaNome || title}</div>
              <div>Reprovas: <strong>${item.value}</strong></div>
            </div>
          `;
        },
      },
      color: '#ff4d4f',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [data]);

  if (loading) {
    return null; // Loading é tratado no componente pai
  }

  return (
    <div>
      <Title level={4}>Top 10 Perguntas com Mais Reprovas</Title>
      <Text type="secondary">
        Período: {periodo[0].format('DD/MM/YYYY')} a {periodo[1].format('DD/MM/YYYY')}
      </Text>
      {chartConfig ? (
        <div style={{ height: '500px', marginTop: 16 }}>
          <Column {...chartConfig} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">
            Nenhuma reprova encontrada para perguntas.
          </Text>
        </div>
      )}
    </div>
  );
}

