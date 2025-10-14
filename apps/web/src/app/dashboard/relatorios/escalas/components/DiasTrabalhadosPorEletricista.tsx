'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosDias {
  eletricista: string;
  diasTrabalhados: number;
}

interface DiasTrabalhadosPorEletricistaProps {
  filtros?: any;
}

export default function DiasTrabalhadosPorEletricista({
  filtros,
}: DiasTrabalhadosPorEletricistaProps) {
  const [dados, setDados] = useState<DadosDias[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getDiasTrabalhadosPorEletricista } = await import(
          '@/lib/actions/relatorios/relatoriosEscalas'
        );
        const result = await getDiasTrabalhadosPorEletricista(filtros);
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
      <Card title="Top 20 - Dias Trabalhados por Eletricista">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Top 20 - Dias Trabalhados por Eletricista">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
    xField: 'eletricista',
    yField: 'diasTrabalhados',
    label: {
      text: 'diasTrabalhados',
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
        style: {
          fontSize: 10,
        },
      },
    },
  };

  return (
    <Card title="Top 20 - Dias Trabalhados por Eletricista">
      <Column {...config} />
    </Card>
  );
}

