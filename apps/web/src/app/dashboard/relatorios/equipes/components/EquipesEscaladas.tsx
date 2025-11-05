'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosEscaladas {
  status: string;
  quantidade: number;
}

interface EquipesEscaladasProps {
  filtros?: any;
}

export default function EquipesEscaladas({ filtros }: EquipesEscaladasProps) {
  const { data: dados = [], loading } = useDataFetch<DadosEscaladas[]>(
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

  if (loading) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

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
    color: ({ status }: any) => {
      return status === 'Escaladas' ? '#52c41a' : '#faad14';
    },
  };

  return (
    <Card title="Equipes Escaladas vs Não Escaladas">
      <Pie {...config} />
    </Card>
  );
}

