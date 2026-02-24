'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';

interface DadosEscaladas {
  status: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/app/dashboard/relatorios/types';

interface EquipesEscaladasProps {
  filtros?: FiltrosRelatorioBase;
}

export default function EquipesEscaladas({ filtros }: EquipesEscaladasProps) {
  const { data: dados = [], loading, error, refetch } = useDataFetch<DadosEscaladas[]>(
    async () => {
      const { getEquipesEscaladas } = await import(
        '@/lib/actions/relatorios/relatoriosEquipes'
      );
      const result = await getEquipesEscaladas(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de equipes escaladas');
    },
    [filtros]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  if (!dadosSeguros?.length && !error) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dadosSeguros,
    angleField: 'quantidade',
    colorField: 'status',
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
    color: ({ status }: DadosEscaladas) => {
      return status === 'Escaladas' ? '#52c41a' : '#faad14';
    },
  };

  return (
    <Card title="Equipes Escaladas vs Não Escaladas">
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de equipes escaladas" />
      {dadosSeguros && dadosSeguros.length > 0 && <Pie {...config} />}
    </Card>
  );
}
