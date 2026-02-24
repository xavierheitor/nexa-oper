'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';

interface DadosHorario {
  horario: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/ui/pages/dashboard/relatorios/types';

interface EquipesPorHorarioProps {
  filtros?: FiltrosRelatorioBase;
}

export default function EquipesPorHorario({ filtros }: EquipesPorHorarioProps) {
  const { data: dados = [], loading, error, refetch } = useDataFetch<DadosHorario[]>(
    async () => {
      const { getEquipesPorHorario } = await import(
        '@/lib/actions/relatorios/relatoriosEquipes'
      );
      const result = await getEquipesPorHorario(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de equipes por horário');
    },
    [filtros]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Equipes por Horário">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Equipes por Horário">
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
      <Card title="Equipes por Horário">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dadosSeguros,
    xField: 'horario',
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
      fill: '#722ed1',
    },
  };

  return (
    <Card title="Equipes por Horário">
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de equipes por horário" />
      {dadosSeguros && dadosSeguros.length > 0 && <Column {...config} />}
    </Card>
  );
}
