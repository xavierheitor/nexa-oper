'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface DadosTipo {
  tipo: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/ui/pages/dashboard/relatorios/types';

interface VeiculosPorTipoProps {
  filtros?: FiltrosRelatorioBase;
}

export default function VeiculosPorTipo({ filtros }: VeiculosPorTipoProps) {
  const { data: dados = [], loading } = useDataFetch<DadosTipo[]>(
    async () => {
      const { getVeiculosPorTipo } = await import(
        '@/lib/actions/relatorios/relatoriosVeiculos'
      );
      const result = await getVeiculosPorTipo(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de veículos por tipo');
    },
    [filtros]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Veículos por Tipo">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Veículos por Tipo">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Veículos por Tipo">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
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

