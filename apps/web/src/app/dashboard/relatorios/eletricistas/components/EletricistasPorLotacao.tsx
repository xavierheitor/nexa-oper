'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosLotacao {
  base: string;
  quantidade: number;
}

interface EletricistasPorLotacaoProps {
  filtros?: any;
}

export default function EletricistasPorLotacao({
  filtros,
}: EletricistasPorLotacaoProps) {
  const [dados, setDados] = useState<DadosLotacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getEletricistasPorLotacao } = await import(
          '@/lib/actions/relatorios/relatoriosEletricistas'
        );
        const result = await getEletricistasPorLotacao(filtros);
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
      <Card title="Eletricistas por Lotação">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Eletricistas por Lotação">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
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
      fill: '#13c2c2',
    },
  };

  return (
    <Card title="Eletricistas por Lotação">
      <Column {...config} />
    </Card>
  );
}

