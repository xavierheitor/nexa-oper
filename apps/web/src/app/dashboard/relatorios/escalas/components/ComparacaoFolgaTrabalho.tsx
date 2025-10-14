'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';

interface DadosComparacao {
  tipo: string;
  quantidade: number;
}

interface ComparacaoFolgaTrabalhoProps {
  filtros?: any;
}

export default function ComparacaoFolgaTrabalho({
  filtros,
}: ComparacaoFolgaTrabalhoProps) {
  const [dados, setDados] = useState<DadosComparacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getComparacaoFolgaTrabalho } = await import(
          '@/lib/actions/relatorios/relatoriosEscalas'
        );
        const result = await getComparacaoFolgaTrabalho(filtros);
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
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dados,
    xField: 'tipo',
    yField: 'quantidade',
    label: {
      text: 'quantidade',
      position: 'top',
      style: {
        fill: '#000',
        fontWeight: 'bold',
      },
    },
    color: ({ tipo }: any) => {
      if (tipo === 'Trabalho') return '#52c41a';
      if (tipo === 'Folga') return '#1890ff';
      if (tipo === 'Falta') return '#ff4d4f';
      return '#d9d9d9';
    },
  };

  return (
    <Card title="Comparação: Trabalho vs Folga vs Falta">
      <Column {...config} />
    </Card>
  );
}

