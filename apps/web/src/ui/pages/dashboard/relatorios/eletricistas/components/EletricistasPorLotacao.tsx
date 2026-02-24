'use client';

import { Column } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface DadosLotacao {
  base: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/ui/pages/dashboard/relatorios/types';

interface EletricistasPorLotacaoProps {
  filtros?: FiltrosRelatorioBase;
}

export default function EletricistasPorLotacao({
  filtros,
}: EletricistasPorLotacaoProps) {
  const { data: dadosRaw, loading } = useDataFetch<DadosLotacao[]>(
    async () => {
      const { getEletricistasPorLotacao } = await import(
        '@/lib/actions/relatorios/relatoriosEletricistas'
      );
      const result = await getEletricistasPorLotacao(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de eletricistas por lotação');
    },
    [filtros]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Eletricistas por Lotação">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Garante que dados nunca seja null
  const dados: DadosLotacao[] = dadosRaw ?? [];

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

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
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

