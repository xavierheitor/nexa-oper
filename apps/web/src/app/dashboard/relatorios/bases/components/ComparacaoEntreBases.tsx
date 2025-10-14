'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosComparacao {
  base: string;
  veiculos: number;
  eletricistas: number;
  equipes: number;
}

interface ComparacaoEntreBasesProps {
  filtros?: any;
}

export default function ComparacaoEntreBases({
  filtros,
}: ComparacaoEntreBasesProps) {
  const [dados, setDados] = useState<DadosComparacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrica, setMetrica] = useState<'veiculos' | 'eletricistas' | 'equipes'>(
    'eletricistas'
  );

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getComparacaoEntreBases } = await import(
          '@/lib/actions/relatorios/relatoriosBases'
        );
        const result = await getComparacaoEntreBases(filtros);
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
      <Card title="Comparação entre Bases">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Comparação entre Bases">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Preparar dados para o gráfico com base na métrica selecionada
  const dadosGrafico = dados.map((d) => ({
    base: d.base,
    quantidade: d[metrica],
  }));

  const config = {
    data: dadosGrafico,
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
      fill:
        metrica === 'veiculos'
          ? '#1890ff'
          : metrica === 'eletricistas'
            ? '#52c41a'
            : '#722ed1',
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
      },
    },
  };

  return (
    <Card
      title="Comparação entre Bases"
      extra={
        <Select
          value={metrica}
          onChange={setMetrica}
          style={{ width: 150 }}
          options={[
            { value: 'veiculos', label: 'Veículos' },
            { value: 'eletricistas', label: 'Eletricistas' },
            { value: 'equipes', label: 'Equipes' },
          ]}
        />
      }
    >
      <Column {...config} />
    </Card>
  );
}

