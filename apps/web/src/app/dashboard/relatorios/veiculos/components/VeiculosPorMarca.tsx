'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosMarca {
  modelo: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '../../types';

interface VeiculosPorMarcaProps {
  filtros?: FiltrosRelatorioBase;
}

export default function VeiculosPorMarca({ filtros }: VeiculosPorMarcaProps) {
  const { data: dados = [], loading } = useDataFetch<DadosMarca[]>(
    async () => {
      const { getVeiculosPorMarca } = await import(
        '@/lib/actions/relatorios/relatoriosVeiculos'
      );
      const result = await getVeiculosPorMarca(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de veículos por marca');
    },
    [filtros]
  );

  if (loading) {
    return (
      <Card title="Veículos por Modelo">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Veículos por Modelo">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
    xField: 'modelo',
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
      fill: '#52c41a',
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
      },
    },
  };

  return (
    <Card title="Veículos por Modelo">
      <Column {...config} />
    </Card>
  );
}

