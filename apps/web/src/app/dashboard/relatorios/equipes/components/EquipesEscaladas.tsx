'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosEscaladas {
  status: string;
  quantidade: number;
}

interface EquipesEscaladasProps {
  filtros?: any;
}

export default function EquipesEscaladas({ filtros }: EquipesEscaladasProps) {
  const [dados, setDados] = useState<DadosEscaladas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getEquipesEscaladas } = await import(
          '@/lib/actions/relatorios/relatoriosEquipes'
        );
        const result = await getEquipesEscaladas(filtros);
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
      <Card title="Equipes Escaladas vs Não Escaladas">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Equipes Escaladas vs Não Escaladas">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
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

