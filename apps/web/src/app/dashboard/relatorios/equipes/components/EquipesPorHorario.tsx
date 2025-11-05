'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosHorario {
  horario: string;
  quantidade: number;
}

interface EquipesPorHorarioProps {
  filtros?: any;
}

export default function EquipesPorHorario({ filtros }: EquipesPorHorarioProps) {
  const { data: dados = [], loading } = useDataFetch<DadosHorario[]>(
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

  if (loading) {
    return (
      <Card title="Equipes por Horário">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Equipes por Horário">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
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
      <Column {...config} />
    </Card>
  );
}

