'use client';

import { useState, useEffect } from 'react';
import { Card, Space, DatePicker, Select, Button, message } from 'antd';
import { App } from 'antd';
import { listFaltas } from '@/lib/actions/turno-realizado/listFaltas';
import { FaltaListResponse, FaltaStatus, FaltaStatusLabels } from '@/lib/schemas/turnoRealizadoSchema';
import { listTiposJustificativa } from '@/lib/actions/justificativa/listTipos';
import { criarJustificativa } from '@/lib/actions/justificativa/criarJustificativa';
import { uploadAnexoJustificativa } from '@/lib/actions/justificativa/uploadAnexo';
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
  const [tiposJustificativa, setTiposJustificativa] = useState<Array<{ id: number; nome: string }>>([]);
  const [loadingJustificar, setLoadingJustificar] = useState(false);

  // Carregar tipos de justificativa
  useEffect(() => {
    const loadTipos = async () => {
      try {
        const result = await listTiposJustificativa();
        if (result.success && result.data) {
          setTiposJustificativa(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de justificativa:', error);
      }
    };
    loadTipos();
  }, []);

  // Fetcher para SWR
  const fetcher = async (): Promise<FaltaListResponse> => {
    const result = await listFaltas({
      ...filtros,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar faltas');
    }

    if (!result.data) {
      throw new Error('Dados não retornados');
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
    anexos?: File[];
  }) => {
    setLoadingJustificar(true);
    try {
      // 1. Criar justificativa primeiro
      const resultJustificativa = await criarJustificativa({
        faltaId: data.faltaId,
        tipoId: data.tipoJustificativaId,
        descricao: data.descricao,
      });

      if (!resultJustificativa.success || !resultJustificativa.data) {
        throw new Error(resultJustificativa.error || 'Erro ao criar justificativa');
      }

      const justificativaId = resultJustificativa.data.id;

      // 2. Fazer upload dos anexos se houver
      if (data.anexos && data.anexos.length > 0) {
        const uploadPromises = data.anexos.map((file) =>
          uploadAnexoJustificativa({
            justificativaId,
            file,
          })
        );

        const uploadResults = await Promise.allSettled(uploadPromises);

        // Verificar se algum upload falhou
        const failedUploads = uploadResults.filter((r) => r.status === 'rejected');
        if (failedUploads.length > 0) {
          console.error('Alguns anexos falharam no upload:', failedUploads);
          messageApi.warning(
            `Justificativa criada, mas ${failedUploads.length} anexo(s) falharam no upload.`
          );
        }
      }

      messageApi.success('Justificativa criada com sucesso!');
      setModalJustificarOpen(false);
      setFaltaSelecionada(null);
      await mutate();
    } catch (error: any) {
      console.error('Erro ao justificar falta:', error);
      messageApi.error(error.message || 'Erro ao criar justificativa');
    } finally {
      setLoadingJustificar(false);
    }
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
        loading={loadingJustificar}
        tiposJustificativa={tiposJustificativa}
      />
    </div>
  );
}

