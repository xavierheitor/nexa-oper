'use client';

import { Pie } from '@ant-design/plots';
import { Card, Empty, Spin } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosTipo {
  tipo: string;
  quantidade: number;
}

import type { FiltrosRelatorioBase } from '@/app/dashboard/relatorios/types';

interface EletricistasPorTipoEquipeProps {
  filtros?: FiltrosRelatorioBase;
}

export default function EletricistasPorTipoEquipe({
  filtros,
}: EletricistasPorTipoEquipeProps) {
  const { data: dadosRaw, loading } = useDataFetch<DadosTipo[]>(
    async () => {
      const { getEletricistasPorTipoEquipe } = await import(
        '@/lib/actions/relatorios/relatoriosEletricistas'
      );
      const result = await getEletricistasPorTipoEquipe(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de eletricistas por tipo de equipe');
    },
    [filtros]
  );

  // Garante que dados nunca seja null
  const dados: DadosTipo[] = dadosRaw ?? [];

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

  // Garante que dados não é null após a verificação
  const dadosSeguros = dados;

  const config = {
    data: dadosSeguros,
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

