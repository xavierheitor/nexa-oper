'use client';

import { EyeOutlined } from '@ant-design/icons';
import { listAtividadeExecucoes } from '@/lib/actions/atividade/listExecucoes';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import type { PaginatedParams } from '@/lib/types/common';
import type {
  AtividadesFilterFieldMap,
  AtividadeExecucaoListItem,
  AtividadeExecucaoPaginated,
} from '@/lib/types/atividadeDashboard';
import { Button, Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import AtividadeExecucaoDetalhesModal from './AtividadeExecucaoDetalhesModal';
import AtividadesTableFilters from './AtividadesTableFilters';

interface AtividadesVisaoGeralPageClientProps {
  initialData?: AtividadeExecucaoPaginated;
}

export default function AtividadesVisaoGeralPageClient({
  initialData,
}: AtividadesVisaoGeralPageClientProps) {
  const [detalhesOpen, setDetalhesOpen] = useState(false);
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
    },
  });

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
      extra={<Button onClick={() => atividades.mutate()}>Atualizar</Button>}
    >
      <AtividadesTableFilters
        onFilterChange={(
          field: keyof AtividadesFilterFieldMap,
          value?: number | Date
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
