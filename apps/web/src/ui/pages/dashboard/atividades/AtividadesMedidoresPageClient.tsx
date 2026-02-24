'use client';

import { listAtividadeMedidores } from '@/lib/actions/atividade/listMedidores';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import type {
  AtividadesFilterFieldMap,
  AtividadeMedidorListItem,
  AtividadeMedidorPaginated,
} from '@/lib/types/atividadeDashboard';
import { Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AtividadesTableFilters from './AtividadesTableFilters';

interface AtividadesMedidoresPageClientProps {
  initialData?: AtividadeMedidorPaginated;
}

export default function AtividadesMedidoresPageClient({
  initialData,
}: AtividadesMedidoresPageClientProps) {
  const medidores = useEntityData<AtividadeMedidorListItem>({
    key: 'atividades-medidores',
    fetcherAction: unwrapPaginatedFetcher(listAtividadeMedidores),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'createdAt',
      orderDir: 'desc',
    },
  });

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
      extra={<Button onClick={() => medidores.mutate()}>Atualizar</Button>}
    >
      <AtividadesTableFilters
        onFilterChange={(
          field: keyof AtividadesFilterFieldMap,
          value?: number | Date
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
