'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';

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
  const { data: dados = [], loading, error, refetch } = useDataFetch<DadosComparacao[]>(
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

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Comparação Folga vs Trabalho">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  if (!dadosSeguros?.length && !error) {
    return (
      <Card title="Comparação: Trabalho vs Folga vs Falta">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

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
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de comparação" />
      {dadosSeguros && dadosSeguros.length > 0 && <Column {...config} />}
    </Card>
  );
}

