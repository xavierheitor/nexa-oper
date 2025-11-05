'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Select, Spin } from 'antd';
import { useState, useMemo } from 'react';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

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
  const [metrica, setMetrica] = useState<'veiculos' | 'eletricistas' | 'equipes'>(
    'eletricistas'
  );

  // Memoiza a função fetcher para evitar recriações desnecessárias
  const fetcher = useMemo(
    () => async () => {
      const { getComparacaoEntreBases } = await import(
        '@/lib/actions/relatorios/relatoriosBases'
      );
      const result = await getComparacaoEntreBases(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de comparação entre bases');
    },
    [filtros]
  );

  const { data: dadosRaw, loading } = useDataFetch<DadosComparacao[]>(fetcher, [fetcher]);

  // Garante que dados nunca seja null
  const dados: DadosComparacao[] = dadosRaw ?? [];

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

  // Memoiza os dados do gráfico para evitar recálculos desnecessários
  const dadosGrafico = useMemo(
    () =>
      (dados || []).map((d) => ({
        base: d.base,
        quantidade: d[metrica],
      })),
    [dados, metrica]
  );

  // Memoiza a configuração do gráfico
  const config = useMemo(
    () => ({
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
    }),
    [dadosGrafico, metrica]
  );

  // Memoiza as opções do Select
  const metricOptions = useMemo(
    () => [
      { value: 'veiculos' as const, label: 'Veículos' },
      { value: 'eletricistas' as const, label: 'Eletricistas' },
      { value: 'equipes' as const, label: 'Equipes' },
    ],
    []
  );

  return (
    <Card
      title="Comparação entre Bases"
      extra={
        <Select
          value={metrica}
          onChange={setMetrica}
          style={{ width: 150 }}
          options={metricOptions}
        />
      }
    >
      <Column {...config} />
    </Card>
  );
}

