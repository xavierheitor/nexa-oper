'use client';

import { useState } from 'react';
import { Card, Spin } from 'antd';
import { getConsolidadoEletricista } from '@/lib/actions/turno-realizado/getConsolidadoEletricista';
import {
  ConsolidadoEletricistaResponse,
  PeriodoTipo,
} from '@/lib/schemas/turnoRealizadoSchema';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import ConsolidadoEletricistaCard from '@/ui/components/ConsolidadoEletricistaCard';
import HistoricoTable from '@/ui/components/HistoricoTable';
import PeriodoSelector from '@/ui/components/PeriodoSelector';
import useSWR from 'swr';

interface FrequenciaEletricistaPageClientProps {
  eletricistaId: number;
  initialData?: ConsolidadoEletricistaResponse;
}

export default function FrequenciaEletricistaPageClient({
  eletricistaId,
  initialData,
}: FrequenciaEletricistaPageClientProps) {
  const [periodo, setPeriodo] = useState<{
    periodo: PeriodoTipo;
    dataInicio?: Date;
    dataFim?: Date;
  }>({
    periodo: 'mes',
  });

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
      throw new Error('Dados nao retornados');
    }

    return result.data;
  };

  const { data, error, isLoading, mutate } = useSWR<ConsolidadoEletricistaResponse>(
    ['frequencia-eletricista', eletricistaId, periodo],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      fallbackData: initialData,
    }
  );

  if (isLoading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size='large' />
      </div>
    );
  }

  if (!data && !error) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <ErrorAlert error={error?.message} onRetry={mutate} />

      {error && !data ? (
        <Card>
          <p>Erro ao carregar dados: {error.message}</p>
        </Card>
      ) : data ? (
        <>
          <Card
            title={`Frequencia - ${data.eletricista.nome} (${data.eletricista.matricula})`}
            extra={<PeriodoSelector value={periodo} onChange={setPeriodo} />}
            style={{ marginBottom: 24 }}
          >
            <ConsolidadoEletricistaCard resumo={data.resumo} loading={isLoading} />
          </Card>

          <Card title='Historico Detalhado' style={{ marginBottom: 24 }}>
            <HistoricoTable dados={data.detalhamento} loading={isLoading} />
          </Card>
        </>
      ) : null}
    </div>
  );
}
