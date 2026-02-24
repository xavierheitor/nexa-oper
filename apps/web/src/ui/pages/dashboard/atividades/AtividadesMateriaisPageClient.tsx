'use client';

import { listAtividadeMateriais } from '@/lib/actions/atividade/listMateriais';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import type {
  AtividadesFilterFieldMap,
  AtividadeMaterialListItem,
  AtividadeMaterialPaginated,
} from '@/lib/types/atividadeDashboard';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Button, Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AtividadesTableFilters from './AtividadesTableFilters';

interface AtividadesMateriaisPageClientProps {
  initialData?: AtividadeMaterialPaginated;
}

export default function AtividadesMateriaisPageClient({
  initialData,
}: AtividadesMateriaisPageClientProps) {
  const materiais = useEntityData<AtividadeMaterialListItem>({
    key: 'atividades-materiais',
    fetcherAction: unwrapPaginatedFetcher(listAtividadeMateriais),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'createdAt',
      orderDir: 'desc',
    },
  });

  const columns: ColumnsType<AtividadeMaterialListItem> = [
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
      title: 'Código',
      dataIndex: 'materialCodigoSnapshot',
      key: 'materialCodigoSnapshot',
      sorter: true,
      width: 140,
      ...getTextFilter<AtividadeMaterialListItem>(
        'materialCodigoSnapshot',
        'código do material'
      ),
    },
    {
      title: 'Material',
      dataIndex: 'materialDescricaoSnapshot',
      key: 'materialDescricaoSnapshot',
      width: 280,
      ...getTextFilter<AtividadeMaterialListItem>(
        'materialDescricaoSnapshot',
        'material'
      ),
    },
    {
      title: 'Unidade',
      dataIndex: 'unidadeMedidaSnapshot',
      key: 'unidadeMedidaSnapshot',
      width: 120,
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      sorter: true,
      width: 120,
      render: (value: number) => value.toLocaleString('pt-BR'),
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

  if (materiais.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar materiais aplicados.</p>;
  }

  return (
    <Card
      title='Atividades - Materiais Aplicados'
      extra={<Button onClick={() => materiais.mutate()}>Atualizar</Button>}
    >
      <AtividadesTableFilters
        onFilterChange={(
          field: keyof AtividadesFilterFieldMap,
          value?: number | Date
        ) =>
          materiais.setParams((prev) => ({
            ...prev,
            [field]: value,
            page: 1,
          }))
        }
      />

      <Table<AtividadeMaterialListItem>
        columns={columns}
        dataSource={materiais.data}
        loading={materiais.isLoading}
        rowKey='id'
        pagination={materiais.pagination}
        onChange={materiais.handleTableChange}
        scroll={{ x: 1900 }}
      />
    </Card>
  );
}
