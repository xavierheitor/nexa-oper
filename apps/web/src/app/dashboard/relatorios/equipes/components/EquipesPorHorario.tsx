'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosHorario {
  horario: string;
  quantidade: number;
}

interface EquipesPorHorarioProps {
  filtros?: any;
}

export default function EquipesPorHorario({ filtros }: EquipesPorHorarioProps) {
  const [dados, setDados] = useState<DadosHorario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getEquipesPorHorario } = await import(
          '@/lib/actions/relatorios/relatoriosEquipes'
        );
        const result = await getEquipesPorHorario(filtros);
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

