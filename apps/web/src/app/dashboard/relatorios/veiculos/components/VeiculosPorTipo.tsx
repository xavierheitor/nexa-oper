'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosTipo {
  tipo: string;
  quantidade: number;
}

interface VeiculosPorTipoProps {
  filtros?: any;
}

export default function VeiculosPorTipo({ filtros }: VeiculosPorTipoProps) {
  const [dados, setDados] = useState<DadosTipo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getVeiculosPorTipo } = await import(
          '@/lib/actions/relatorios/relatoriosVeiculos'
        );
        const result = await getVeiculosPorTipo(filtros);
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
      <Card title="Veículos por Tipo">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Veículos por Tipo">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
    angleField: 'quantidade',
    colorField: 'tipo',
    label: {
      text: 'quantidade',
      style: {
        fontWeight: 'bold',
      },
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
  };

  return (
    <Card title="Veículos por Tipo">
      <Pie {...config} />
    </Card>
  );
}

