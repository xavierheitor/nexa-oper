'use client';

import { useState } from 'react';
import { Card, Space, DatePicker, Select, Button, message } from 'antd';
import { App } from 'antd';
import { listHorasExtras } from '@/lib/actions/turno-realizado/listHorasExtras';
import { aprovarHoraExtra } from '@/lib/actions/turno-realizado/aprovarHoraExtra';
import {
  HoraExtraListResponse,
  HoraExtraStatus,
  HoraExtraStatusLabels,
  HoraExtraTipo,
  HoraExtraTipoLabels,
  AcaoAprovacao,
} from '@/lib/schemas/turnoRealizadoSchema';
import HoraExtraTable from '@/ui/components/HoraExtraTable';
import AprovarHoraExtraModal from '@/ui/components/AprovarHoraExtraModal';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import type { TablePaginationConfig } from 'antd/es/table';

const { RangePicker } = DatePicker;

/**
 * Página de lista de horas extras
 */
export default function HorasExtrasPage() {
  const { message: messageApi } = App.useApp();

  const [filtros, setFiltros] = useState({
    eletricistaId: undefined as number | undefined,
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
    tipo: undefined as HoraExtraTipo | undefined,
    status: undefined as HoraExtraStatus | undefined,
    page: 1,
    pageSize: 20,
  });

  const [horaExtraSelecionada, setHoraExtraSelecionada] = useState<
    HoraExtraListResponse['data'][0] | null
  >(null);
  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);

  // Fetcher para SWR
  const fetcher = async (): Promise<HoraExtraListResponse> => {
    const result = await listHorasExtras({
      ...filtros,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar horas extras');
    }

    if (!result.data) {
      throw new Error('Dados não retornados');
    }

    return result.data;
  };

  const { data, error, isLoading, mutate } = useSWR<HoraExtraListResponse>(
    ['horas-extras', filtros],
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

  const handleAprovar = (horaExtra: HoraExtraListResponse['data'][0]) => {
    setHoraExtraSelecionada(horaExtra);
    setModalAprovacaoOpen(true);
  };

  const handleRejeitar = (horaExtra: HoraExtraListResponse['data'][0]) => {
    setHoraExtraSelecionada(horaExtra);
    setModalAprovacaoOpen(true);
  };

  const handleAprovarSubmit = async (data: {
    id: number;
    acao: AcaoAprovacao;
    observacoes?: string;
  }) => {
    const result = await aprovarHoraExtra(data);

    if (result.success) {
      messageApi.success(
        `Hora extra ${data.acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso`
      );
      setModalAprovacaoOpen(false);
      setHoraExtraSelecionada(null);
      await mutate();
    } else {
      messageApi.error(result.error || 'Erro ao aprovar hora extra');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Horas Extras"
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
              placeholder="Tipo"
              allowClear
              style={{ width: 180 }}
              value={filtros.tipo}
              onChange={(value) =>
                setFiltros((prev) => ({ ...prev, tipo: value, page: 1 }))
              }
              options={Object.entries(HoraExtraTipoLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              value={filtros.status}
              onChange={(value) =>
                setFiltros((prev) => ({ ...prev, status: value, page: 1 }))
              }
              options={Object.entries(HoraExtraStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Button onClick={() => mutate()}>Atualizar</Button>
          </Space>
        }
      >
        <HoraExtraTable
          horasExtras={data?.data || []}
          loading={isLoading}
          pagination={data?.pagination}
          onTableChange={handleTableChange}
          onAprovar={handleAprovar}
          onRejeitar={handleRejeitar}
        />
      </Card>

      <AprovarHoraExtraModal
        open={modalAprovacaoOpen}
        onClose={() => {
          setModalAprovacaoOpen(false);
          setHoraExtraSelecionada(null);
        }}
        onAprovar={handleAprovarSubmit}
        horaExtra={horaExtraSelecionada}
        loading={false}
      />
    </div>
  );
}

