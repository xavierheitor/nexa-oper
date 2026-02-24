'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface DadosLotacao {
  base: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/ui/pages/dashboard/relatorios/types';

interface VeiculosPorLotacaoProps {
  filtros?: FiltrosRelatorioBase;
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

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Veículos por Lotação">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Veículos por Lotação">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Veículos por Lotação">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
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

