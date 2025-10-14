'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosLotacao {
  base: string;
  quantidade: number;
}

interface VeiculosPorLotacaoProps {
  filtros?: any;
}

export default function VeiculosPorLotacao({ filtros }: VeiculosPorLotacaoProps) {
  const [dados, setDados] = useState<DadosLotacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getVeiculosPorLotacao } = await import(
          '@/lib/actions/relatorios/relatoriosVeiculos'
        );
        const result = await getVeiculosPorLotacao(filtros);
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
      <Card title="Veículos por Lotação">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Veículos por Lotação">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
    xField: 'base',
    yField: 'quantidade',
    label: {
      text: 'quantidade',
      position: 'top',
      style: {
        fill: '#000',
        fontWeight: 'bold',
      },
    },
    style: {
      fill: '#1890ff',
    },
  };

  return (
    <Card title="Veículos por Lotação">
      <Column {...config} />
    </Card>
  );
}

