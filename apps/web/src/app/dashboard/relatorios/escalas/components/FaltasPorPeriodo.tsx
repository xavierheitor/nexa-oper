'use client';

import { Line } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosFaltas {
  data: string;
  quantidade: number;
}

interface FaltasPorPeriodoProps {
  filtros?: any;
}

export default function FaltasPorPeriodo({ filtros }: FaltasPorPeriodoProps) {
  const [dados, setDados] = useState<DadosFaltas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getFaltasPorPeriodo } = await import(
          '@/lib/actions/relatorios/relatoriosEscalas'
        );
        const result = await getFaltasPorPeriodo(filtros);
        if (result.success && result.data) {
          setDados(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [filtros]);

  if (loading) {
    return (
      <Card title="Evolução de Faltas por Período">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Evolução de Faltas por Período">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
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

