'use client';

import { Line } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosFaltas {
  data: string;
  quantidade: number;
}

interface FaltasPorPeriodoProps {
  filtros?: any;
}

export default function FaltasPorPeriodo({ filtros }: FaltasPorPeriodoProps) {
  const { data: dados = [], loading } = useDataFetch<DadosFaltas[]>(
    async () => {
      const { getFaltasPorPeriodo } = await import(
        '@/lib/actions/relatorios/relatoriosEscalas'
      );
      const result = await getFaltasPorPeriodo(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de faltas por período');
    },
    [filtros]
  );

  if (loading) {
    return (
      <Card title="Evolução de Faltas por Período">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Evolução de Faltas por Período">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
    xField: 'data',
    yField: 'quantidade',
    point: {
      size: 5,
      shape: 'circle',
    },
    label: {
      text: 'quantidade',
      style: {
        fontSize: 10,
      },
    },
    style: {
      stroke: '#ff4d4f',
      lineWidth: 2,
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: true,
      },
    },
  };

  return (
    <Card title="Evolução de Faltas por Período">
      <Line {...config} />
    </Card>
  );
}

