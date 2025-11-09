'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

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
  const { data: dados = [], loading } = useDataFetch<DadosComparacao[]>(
    async () => {
      const { getComparacaoFolgaTrabalho } = await import(
        '@/lib/actions/relatorios/relatoriosEscalas'
      );
      const result = await getComparacaoFolgaTrabalho(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de comparação');
    },
    [filtros]
  );

  if (loading) {
    return (
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length) {
    return (
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
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

