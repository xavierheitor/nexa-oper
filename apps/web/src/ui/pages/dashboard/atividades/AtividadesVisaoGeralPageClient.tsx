'use client';

import { EyeOutlined, FileExcelOutlined } from '@ant-design/icons';
import { listAtividadeExecucoes } from '@/lib/actions/atividade/listExecucoes';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import type { PaginatedParams } from '@/lib/types/common';
import { getLastMonthDateRange } from '@/lib/utils/dateHelpers';
import type {
  AtividadesFilterFieldMap,
  AtividadeExecucaoListItem,
  AtividadeExecucaoPaginated,
} from '@/lib/types/atividadeDashboard';
import { App, Button, Card, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import AtividadeExecucaoDetalhesModal from './AtividadeExecucaoDetalhesModal';
import AtividadesTableFilters from './AtividadesTableFilters';
import { downloadCsvAsExcelFile, fetchAllPaginatedRows } from './exportUtils';

interface AtividadesVisaoGeralPageClientProps {
  initialData?: AtividadeExecucaoPaginated;
}

const defaultRangeDates = getLastMonthDateRange();

export default function AtividadesVisaoGeralPageClient({
  initialData,
}: AtividadesVisaoGeralPageClientProps) {
  const { message } = App.useApp();
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<number | null>(
    null
  );

  const fetchAtividadesFinalizadas = async (params?: PaginatedParams) =>
    unwrapPaginatedFetcher(listAtividadeExecucoes)({
      ...params,
      statusFluxo: 'finalizada',
    });

  const atividades = useEntityData<AtividadeExecucaoListItem>({
    key: 'atividades-visao-geral',
    fetcherAction: fetchAtividadesFinalizadas,
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'createdAt',
      orderDir: 'desc',
      dataInicio: defaultRangeDates.inicio,
      dataFim: defaultRangeDates.fim,
    },
  });

  const handleExportarExcel = async () => {
    try {
      setIsExporting(true);
      const registros = await fetchAllPaginatedRows(
        fetchAtividadesFinalizadas,
        atividades.params
      );

      const headers = [
        'ID',
        'Tipo',
        'Subtipo',
        'Nº OS',
        'Equipe',
        'Placa',
        'Dia do Turno',
        'Medidor',
        'Materiais',
        'Produtiva',
        'Causa Improdutiva',
        'Criado em',
      ];

      const rows = registros.map((item) => [
        item.id,
        item.tipoAtividade?.nome || item.tipoAtividadeNomeSnapshot || '',
        item.tipoAtividadeServico?.nome || item.tipoServicoNomeSnapshot || '',
        item.numeroDocumento || '',
        item.turno?.equipe?.nome || '',
        item.turno?.veiculo?.placa || '',
        item.turno?.dataInicio
          ? dayjs(item.turno.dataInicio).format('DD/MM/YYYY')
          : '',
        item.aplicaMedidor ? 'Sim' : 'Não',
        item.aplicaMaterial ? 'Sim' : 'Não',
        item.atividadeProdutiva ? 'Sim' : 'Não',
        item.causaImprodutiva || '',
        dayjs(item.createdAt).format('DD/MM/YYYY HH:mm'),
      ]);

      downloadCsvAsExcelFile('atividades_visao_geral', headers, rows);
    } catch (error) {
      console.error(error);
      message.error('Falha ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnsType<AtividadeExecucaoListItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 64 },
    {
      title: 'Tipo',
      key: 'tipo',
      render: (_value, record) =>
        record.tipoAtividade?.nome || record.tipoAtividadeNomeSnapshot || '-',
      width: 150,
    },
    {
      title: 'Subtipo',
      key: 'subtipo',
      render: (_value, record) =>
        record.tipoAtividadeServico?.nome || record.tipoServicoNomeSnapshot || '-',
      width: 170,
    },
    {
      title: 'Nº OS',
      dataIndex: 'numeroDocumento',
      key: 'numeroDocumento',
      width: 100,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Equipe',
      key: 'turnoEquipe',
      width: 150,
      render: (_value, record) => record.turno?.equipe?.nome || '-',
    },
    {
      title: 'Placa',
      key: 'turnoPlaca',
      width: 110,
      render: (_value, record) => record.turno?.veiculo?.placa || '-',
    },
    {
      title: 'Dia do Turno',
      key: 'turnoDia',
      width: 115,
      render: (_value, record) =>
        record.turno?.dataInicio
          ? new Date(record.turno.dataInicio).toLocaleDateString('pt-BR')
          : '-',
    },
    {
      title: 'Medidor',
      key: 'medidor',
      render: (_value, record) =>
        record.aplicaMedidor ? <Tag color='blue'>Sim</Tag> : <Tag>Não</Tag>,
      width: 90,
    },
    {
      title: 'Materiais',
      key: 'materiais',
      render: (_value, record) =>
        record.aplicaMaterial ? <Tag color='cyan'>Sim</Tag> : <Tag>Não</Tag>,
      width: 90,
    },
    {
      title: 'Produtiva',
      dataIndex: 'atividadeProdutiva',
      key: 'atividadeProdutiva',
      width: 100,
      render: (value: boolean) =>
        value ? (
          <Tag color='green'>Sim</Tag>
        ) : (
          <Tag color='volcano'>Não</Tag>
        ),
    },
    {
      title: 'Causa Improdutiva',
      dataIndex: 'causaImprodutiva',
      key: 'causaImprodutiva',
      width: 220,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 95,
      render: (_value, record) => (
        <Button
          type='link'
          size='small'
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedAtividadeId(record.id);
            setDetalhesOpen(true);
          }}
        >
          Visualizar
        </Button>
      ),
    },
  ];

  if (atividades.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar atividades.</p>;
  }

  return (
    <Card
      title='Atividades - Visão Geral'
      extra={
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            loading={isExporting}
            onClick={handleExportarExcel}
          >
            Exportar Excel
          </Button>
          <Button onClick={() => atividades.mutate()}>Atualizar</Button>
        </Space>
      }
    >
      <AtividadesTableFilters
        defaultRange={[
          dayjs(defaultRangeDates.inicio),
          dayjs(defaultRangeDates.fim),
        ]}
        onFilterBatchChange={(values) =>
          atividades.setParams((prev) => ({
            ...prev,
            ...values,
            page: 1,
          }))
        }
        onFilterChange={(
          field: keyof AtividadesFilterFieldMap,
          value?: number | Date | boolean | string
        ) =>
          atividades.setParams((prev) => ({
            ...prev,
            [field]: value,
            page: 1,
          }))
        }
      />

      <Table<AtividadeExecucaoListItem>
        size='small'
        columns={columns}
        dataSource={atividades.data}
        loading={atividades.isLoading}
        rowKey='id'
        pagination={atividades.pagination}
        onChange={atividades.handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      <AtividadeExecucaoDetalhesModal
        open={detalhesOpen}
        atividadeId={selectedAtividadeId}
        onClose={() => {
          setDetalhesOpen(false);
          setSelectedAtividadeId(null);
        }}
      />
    </Card>
  );
}
