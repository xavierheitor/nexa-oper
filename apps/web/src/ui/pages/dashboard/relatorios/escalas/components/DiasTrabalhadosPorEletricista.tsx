'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';

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
  const { data: dados = [], loading, error, refetch } = useDataFetch<DadosDias[]>(
    async () => {
      const { getDiasTrabalhadosPorEletricista } = await import(
        '@/lib/actions/relatorios/relatoriosEscalas'
      );
      const result = await getDiasTrabalhadosPorEletricista(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de dias trabalhados');
    },
    [filtros]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Dias Trabalhados por Eletricista">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Top 20 - Dias Trabalhados por Eletricista">
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
      <Card title="Top 20 - Dias Trabalhados por Eletricista">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const config = {
    data: dadosSeguros,
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
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de dias trabalhados" />
      {dadosSeguros && dadosSeguros.length > 0 && <Column {...config} />}
    </Card>
  );
}

