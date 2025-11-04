'use client';

import { useState } from 'react';
import { Card, Space, DatePicker, Select, Button, message } from 'antd';
import { App } from 'antd';
import { listFaltas } from '@/lib/actions/turno-realizado/listFaltas';
import { FaltaListResponse, FaltaStatus, FaltaStatusLabels } from '@/lib/schemas/turnoRealizadoSchema';
import FaltaTable from '@/ui/components/FaltaTable';
import JustificarFaltaModal from '@/ui/components/JustificarFaltaModal';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import type { TablePaginationConfig } from 'antd/es/table';

const { RangePicker } = DatePicker;

/**
 * Página de lista de faltas
 */
export default function FaltasPage() {
  const { message: messageApi } = App.useApp();

  const [filtros, setFiltros] = useState({
    eletricistaId: undefined as number | undefined,
    equipeId: undefined as number | undefined,
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
    status: undefined as FaltaStatus | undefined,
    page: 1,
    pageSize: 20,
  });

  const [faltaSelecionada, setFaltaSelecionada] = useState<FaltaListResponse['data'][0] | null>(null);
  const [modalJustificarOpen, setModalJustificarOpen] = useState(false);

  // Fetcher para SWR
  const fetcher = async () => {
    const result = await listFaltas({
      ...filtros,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar faltas');
    }

    return result.data;
  };

  const { data, error, isLoading, mutate } = useSWR<FaltaListResponse>(
    ['faltas', filtros],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFiltros((prev) => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
    }));
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setFiltros((prev) => ({
        ...prev,
        dataInicio: dates[0]!.toDate(),
        dataFim: dates[1]!.toDate(),
        page: 1,
      }));
    } else {
      setFiltros((prev) => ({
        ...prev,
        dataInicio: undefined,
        dataFim: undefined,
        page: 1,
      }));
    }
  };

  const handleJustificar = (falta: FaltaListResponse['data'][0]) => {
    setFaltaSelecionada(falta);
    setModalJustificarOpen(true);
  };

  const handleJustificarSubmit = async (data: {
    faltaId: number;
    tipoJustificativaId: number;
    descricao?: string;
  }) => {
    // TODO: Implementar ação de justificar falta
    messageApi.success('Justificativa criada com sucesso');
    setModalJustificarOpen(false);
    setFaltaSelecionada(null);
    await mutate();
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Faltas"
        extra={
          <Space>
            <RangePicker
              value={
                filtros.dataInicio && filtros.dataFim
                  ? [dayjs(filtros.dataInicio), dayjs(filtros.dataFim)]
                  : null
              }
              onChange={handleRangeChange}
              format="DD/MM/YYYY"
              placeholder={['Data início', 'Data fim']}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              value={filtros.status}
              onChange={(value) =>
                setFiltros((prev) => ({ ...prev, status: value, page: 1 }))
              }
              options={Object.entries(FaltaStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Button onClick={() => mutate()}>Atualizar</Button>
          </Space>
        }
      >
        <FaltaTable
          faltas={data?.data || []}
          loading={isLoading}
          pagination={data?.pagination}
          onTableChange={handleTableChange}
          onJustificar={handleJustificar}
        />
      </Card>

      <JustificarFaltaModal
        open={modalJustificarOpen}
        onClose={() => {
          setModalJustificarOpen(false);
          setFaltaSelecionada(null);
        }}
        onJustificar={handleJustificarSubmit}
        falta={faltaSelecionada}
        loading={false}
      />
    </div>
  );
}

