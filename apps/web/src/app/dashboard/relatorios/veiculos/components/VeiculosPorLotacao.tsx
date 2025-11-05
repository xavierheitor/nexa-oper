'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosLotacao {
  base: string;
  quantidade: number;
}

interface VeiculosPorLotacaoProps {
  filtros?: any;
}

export default function VeiculosPorLotacao({ filtros }: VeiculosPorLotacaoProps) {
  const { data: dados = [], loading } = useDataFetch<DadosLotacao[]>(
    async () => {
      const { getVeiculosPorLotacao } = await import(
        '@/lib/actions/relatorios/relatoriosVeiculos'
      );
      const result = await getVeiculosPorLotacao(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de veículos por lotação');
    },
    [filtros]
  );

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

