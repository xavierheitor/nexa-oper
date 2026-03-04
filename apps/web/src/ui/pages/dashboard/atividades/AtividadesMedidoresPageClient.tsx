'use client';

import { FileExcelOutlined } from '@ant-design/icons';
import { listAtividadeMedidores } from '@/lib/actions/atividade/listMedidores';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { getLastMonthDateRange } from '@/lib/utils/dateHelpers';
import type {
  AtividadesFilterFieldMap,
  AtividadeMedidorListItem,
  AtividadeMedidorPaginated,
} from '@/lib/types/atividadeDashboard';
import { App, Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import AtividadesTableFilters from './AtividadesTableFilters';
import { downloadCsvAsExcelFile, fetchAllPaginatedRows } from './exportUtils';

interface AtividadesMedidoresPageClientProps {
  initialData?: AtividadeMedidorPaginated;
}

const defaultRangeDates = getLastMonthDateRange();

export default function AtividadesMedidoresPageClient({
  initialData,
}: AtividadesMedidoresPageClientProps) {
  const { message } = App.useApp();
  const [isExporting, setIsExporting] = useState(false);
  const fetchAtividadeMedidores = unwrapPaginatedFetcher(listAtividadeMedidores);

  const medidores = useEntityData<AtividadeMedidorListItem>({
    key: 'atividades-medidores',
    fetcherAction: fetchAtividadeMedidores,
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
        fetchAtividadeMedidores,
        medidores.params
      );

      const headers = [
        'ID',
        'Tipo',
        'Nº OS',
        'Turno',
        'Equipe',
        'Placa',
        'Dia do Turno',
        'Somente Retirada',
        'Nº Instalado',
        'Nº Retirado',
        'Leitura Retirada',
        'Criado em',
      ];

      const rows = registros.map((item) => [
        item.id,
        item.atividadeExecucao?.tipoAtividade?.nome ||
          item.atividadeExecucao?.tipoAtividadeNomeSnapshot ||
          '',
        item.atividadeExecucao?.numeroDocumento || '',
        item.atividadeExecucao?.turno?.id || '',
        item.atividadeExecucao?.turno?.equipe?.nome || '',
        item.atividadeExecucao?.turno?.veiculo?.placa || '',
        item.atividadeExecucao?.turno?.dataInicio
          ? dayjs(item.atividadeExecucao.turno.dataInicio).format('DD/MM/YYYY')
          : '',
        item.somenteRetirada ? 'Sim' : 'Não',
        item.instaladoNumero || '',
        item.retiradoNumero || '',
        item.retiradoLeitura || '',
        dayjs(item.createdAt).format('DD/MM/YYYY HH:mm'),
      ]);

      downloadCsvAsExcelFile('atividades_medidores', headers, rows);
    } catch (error) {
      console.error(error);
      message.error('Falha ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnsType<AtividadeMedidorListItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
    {
      title: 'Tipo',
      key: 'tipo',
      width: 180,
      render: (_value, record) =>
        record.atividadeExecucao?.tipoAtividade?.nome ||
        record.atividadeExecucao?.tipoAtividadeNomeSnapshot ||
        '-',
    },
    {
      title: 'Nº OS',
      key: 'numeroDocumento',
      width: 140,
      render: (_value, record) =>
        record.atividadeExecucao?.numeroDocumento || '-',
    },
    {
      title: 'Turno',
      key: 'turnoId',
      width: 100,
      render: (_value, record) => record.atividadeExecucao?.turno?.id || '-',
    },
    {
      title: 'Equipe',
      key: 'turnoEquipe',
      width: 180,
      render: (_value, record) =>
        record.atividadeExecucao?.turno?.equipe?.nome || '-',
    },
    {
      title: 'Placa',
      key: 'turnoPlaca',
      width: 140,
      render: (_value, record) =>
        record.atividadeExecucao?.turno?.veiculo?.placa || '-',
    },
    {
      title: 'Dia do Turno',
      key: 'turnoDia',
      width: 130,
      render: (_value, record) =>
        record.atividadeExecucao?.turno?.dataInicio
          ? new Date(
              record.atividadeExecucao.turno.dataInicio
            ).toLocaleDateString('pt-BR')
          : '-',
    },
    {
      title: 'Somente Retirada',
      dataIndex: 'somenteRetirada',
      key: 'somenteRetirada',
      width: 150,
      render: (value: boolean) =>
        value ? <Tag color='orange'>Sim</Tag> : <Tag>Não</Tag>,
    },
    {
      title: 'Nº Instalado',
      dataIndex: 'instaladoNumero',
      key: 'instaladoNumero',
      width: 150,
    },
    {
      title: 'Nº Retirado',
      dataIndex: 'retiradoNumero',
      key: 'retiradoNumero',
      width: 150,
    },
    {
      title: 'Leitura Retirada',
      dataIndex: 'retiradoLeitura',
      key: 'retiradoLeitura',
      width: 160,
    },
    {
      title: 'Criado em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 130,
      render: (value: Date | string) =>
        new Date(value).toLocaleDateString('pt-BR'),
    },
  ];

  if (medidores.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar medidores aplicados.</p>;
  }

  return (
    <Card
      title='Atividades - Medidores Aplicados'
      extra={
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            loading={isExporting}
            onClick={handleExportarExcel}
          >
            Exportar Excel
          </Button>
          <Button onClick={() => medidores.mutate()}>Atualizar</Button>
        </Space>
      }
    >
      <AtividadesTableFilters
        defaultRange={[
          dayjs(defaultRangeDates.inicio),
          dayjs(defaultRangeDates.fim),
        ]}
        onFilterBatchChange={(values) =>
          medidores.setParams((prev) => ({
            ...prev,
            ...values,
            page: 1,
          }))
        }
        onFilterChange={(
          field: keyof AtividadesFilterFieldMap,
          value?: number | Date | boolean | string
        ) =>
          medidores.setParams((prev) => ({
            ...prev,
            [field]: value,
            page: 1,
          }))
        }
      />

      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          style={{ width: 360 }}
          placeholder='Buscar por Nº OS ou número do medidor'
          onSearch={(value) =>
            medidores.setParams((prev) => ({
              ...prev,
              search: value?.trim() ? value.trim() : undefined,
              page: 1,
            }))
          }
        />
      </Space>

      <Table<AtividadeMedidorListItem>
        columns={columns}
        dataSource={medidores.data}
        loading={medidores.isLoading}
        rowKey='id'
        pagination={medidores.pagination}
        onChange={medidores.handleTableChange}
        scroll={{ x: 1850 }}
      />
    </Card>
  );
}
