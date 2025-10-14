'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosTipo {
  tipo: string;
  quantidade: number;
}

interface EletricistasPorTipoEquipeProps {
  filtros?: any;
}

export default function EletricistasPorTipoEquipe({
  filtros,
}: EletricistasPorTipoEquipeProps) {
  const [dados, setDados] = useState<DadosTipo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getEletricistasPorTipoEquipe } = await import(
          '@/lib/actions/relatorios/relatoriosEletricistas'
        );
        const result = await getEletricistasPorTipoEquipe(filtros);
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
      <Card title="Eletricistas Escalados por Tipo de Equipe">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Eletricistas Escalados por Tipo de Equipe">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
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
    <Card title="Eletricistas Escalados por Tipo de Equipe">
      <Pie {...config} />
    </Card>
  );
}

