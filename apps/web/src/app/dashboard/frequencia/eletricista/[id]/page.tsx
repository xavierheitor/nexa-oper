'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Spin, message } from 'antd';
import { App } from 'antd';
import { getConsolidadoEletricista } from '@/lib/actions/turno-realizado/getConsolidadoEletricista';
import {
  ConsolidadoEletricistaResponse,
  PeriodoTipo,
} from '@/lib/schemas/turnoRealizadoSchema';
import ConsolidadoEletricistaCard from '@/ui/components/ConsolidadoEletricistaCard';
import HistoricoTable from '@/ui/components/HistoricoTable';
import PeriodoSelector from '@/ui/components/PeriodoSelector';
import useSWR from 'swr';

/**
 * Dashboard de frequência individual do eletricista
 */
export default function FrequenciaEletricistaPage() {
  const params = useParams();
  const eletricistaId = Number(params.id);
  const { message: messageApi } = App.useApp();

  const [periodo, setPeriodo] = useState<{
    periodo: PeriodoTipo;
    dataInicio?: Date;
    dataFim?: Date;
  }>({
    periodo: 'mes',
  });

  // Fetcher para SWR
  const fetcher = async (): Promise<ConsolidadoEletricistaResponse> => {
    const result = await getConsolidadoEletricista({
      eletricistaId,
      periodo: periodo.periodo,
      dataInicio: periodo.dataInicio?.toISOString(),
      dataFim: periodo.dataFim?.toISOString(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dados');
    }

    if (!result.data) {
      throw new Error('Dados não retornados');
    }

    return result.data;
  };

  const { data, error, isLoading, mutate } = useSWR<ConsolidadoEletricistaResponse>(
    ['frequencia-eletricista', eletricistaId, periodo],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (error) {
      messageApi.error(error.message || 'Erro ao carregar dados de frequência');
    }
  }, [error, messageApi]);

  if (isLoading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <p>Erro ao carregar dados: {error.message}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={`Frequência - ${data.eletricista.nome} (${data.eletricista.matricula})`}
        extra={
          <PeriodoSelector value={periodo} onChange={setPeriodo} />
        }
        style={{ marginBottom: 24 }}
      >
        <ConsolidadoEletricistaCard resumo={data.resumo} loading={isLoading} />
      </Card>

      <Card title="Histórico Detalhado" style={{ marginBottom: 24 }}>
        <HistoricoTable dados={data.detalhamento} loading={isLoading} />
      </Card>
    </div>
  );
}

