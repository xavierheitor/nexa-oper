'use client';

import { useState } from 'react';
import { createEquipe } from '@/lib/actions/equipe/create';
import { deleteEquipe } from '@/lib/actions/equipe/delete';
import { listEquipes } from '@/lib/actions/equipe/list';
import { updateEquipe } from '@/lib/actions/equipe/update';
import { transferEquipeBase } from '@/lib/actions/equipe/transferBase';
import { listContratos } from '@/lib/actions/contrato/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { listBases } from '@/lib/actions/base/list';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import TransferBaseModal from '@/ui/components/TransferBaseModal';

import { Contrato, Equipe, TipoEquipe, Base } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Space, App, Tag } from 'antd';
import { SwapOutlined } from '@ant-design/icons';

import EquipeForm, { EquipeFormData } from './form';
import EquipeLoteForm from './lote-form';

type EquipeWithBase = Equipe & { baseAtual?: Base | null };

export default function EquipePage() {
  const controller = useCrudController<EquipeWithBase>('equipes');
  const { message } = App.useApp();
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<EquipeWithBase | null>(null);
  const [isTransferLoading, setIsTransferLoading] = useState(false);

  const equipes = useEntityData<EquipeWithBase>({
    key: 'equipes',
    fetcherAction: unwrapPaginatedFetcher(listEquipes),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        tipoEquipe: true,
        contrato: true,
      },
    },
  });

  // Carregar bases para transferência e filtro
  const bases = useEntityData<Base>({
    key: 'bases-equipe',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  // Carregar dados para o formulário em lote
  const { data: contratos } = useEntityData({
    key: 'contratos-lote-equipe',
    fetcherAction: async () => {
      const result = await listContratos({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  const { data: tiposEquipe } = useEntityData({
    key: 'tipos-equipe-lote',
    fetcherAction: async () => {
      const result = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  const columns = useTableColumnsWithActions<EquipeWithBase>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<EquipeWithBase>('nome', 'nome da equipe'),
      },
      {
        title: 'Tipo de Equipe',
        dataIndex: ['tipoEquipe', 'nome'],
        key: 'tipoEquipe',
        sorter: true,
        render: (nome: string) => nome || '-',
        width: 160,
      },
      {
        title: 'Base Atual',
        key: 'baseAtual',
        width: 160,
        render: (_: any, record: EquipeWithBase) => {
          if (!record.baseAtual) {
            return <Tag color="default">Sem lotação</Tag>;
          }
          return <Tag color="blue">{record.baseAtual.nome}</Tag>;
        },
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        render: (nome: string, record: any) => {
          const contrato = record?.contrato;
          return contrato ? `${contrato.nome} (${contrato.numero})` : '-';
        },
        width: 220,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteEquipe({ id: item.id }), 'Equipe excluída com sucesso!')
          .finally(() => {
            equipes.mutate();
          }),
      customActions: [
        {
          key: 'transfer-base',
          label: '',
          type: 'link',
          icon: <SwapOutlined />,
          tooltip: 'Transferir equipe para outra base',
          onClick: (record) => {
            setTransferTarget(record);
          },
        },
      ],
    }
  );

  const handleSubmit = async (values: EquipeFormData) => {
    const action = async (): Promise<ActionResult<Equipe>> => {
      const result = controller.editingItem?.id
        ? await updateEquipe({ ...values, id: controller.editingItem.id })
        : await createEquipe(values);
      return result;
    };

    controller.exec(action, 'Equipe salva com sucesso!').finally(() => {
      equipes.mutate();
    });
  };

  const handleTransferBase = async (data: { novaBaseId: number; motivo?: string }) => {
    if (!transferTarget) return;

    setIsTransferLoading(true);
    try {
      console.log('[EquipePage] Transferindo equipe:', {
        equipeId: transferTarget.id,
        novaBaseId: data.novaBaseId,
        motivo: data.motivo,
      });

      const result = await transferEquipeBase({
        equipeId: transferTarget.id,
        novaBaseId: data.novaBaseId,
        motivo: data.motivo || 'Transferência de base',
      });

      if (result.success) {
        message.success('Equipe transferida com sucesso!');
        setTransferTarget(null);
        equipes.mutate();
      } else {
        message.error(result.error || 'Erro ao transferir equipe');
      }
    } catch (error) {
      console.error('Erro ao transferir equipe:', error);
      message.error('Erro ao transferir equipe');
    } finally {
      setIsTransferLoading(false);
    }
  };

  if (equipes.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar equipes.</p>;
  }

  return (
    <>
      <Card
        title="Equipes"
        extra={
          <Space>
            <Button onClick={() => setIsLoteModalOpen(true)}>
              Cadastro em Lote
            </Button>
            <Button type="primary" onClick={() => controller.open()}>
              Adicionar
            </Button>
          </Space>
        }
      >
        {/* Filtros externos (server-side) */}
        <TableExternalFilters
          filters={[
            {
              label: 'Base',
              placeholder: 'Filtrar por base',
              options: [
                { label: 'Sem lotação', value: -1 },
                ...(bases.data?.map(base => ({
                  label: base.nome,
                  value: base.id,
                })) || []),
              ],
              onChange: (baseId) =>
                equipes.setParams(prev => ({ ...prev, baseId, page: 1 })),
              loading: bases.isLoading,
            },
            {
              label: 'Tipo de Equipe',
              placeholder: 'Filtrar por tipo',
              options: tiposEquipe?.map(tipo => ({
                label: tipo.nome,
                value: tipo.id,
              })) || [],
              onChange: (tipoEquipeId) =>
                equipes.setParams(prev => ({ ...prev, tipoEquipeId, page: 1 })),
            },
          ]}
        />

        <Table<EquipeWithBase>
          columns={columns}
          dataSource={equipes.data}
          loading={equipes.isLoading}
          rowKey="id"
          pagination={equipes.pagination}
          onChange={equipes.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Equipe' : 'Nova Equipe'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <EquipeForm
          initialValues={
            controller.editingItem
              ? {
                  nome: controller.editingItem.nome,
                  tipoEquipeId: (controller.editingItem as any).tipoEquipeId,
                  contratoId: (controller.editingItem as any).contratoId,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>

      {/* Modal de Transferência de Base */}
      <TransferBaseModal
        open={!!transferTarget}
        title={`Transferir Equipe: ${transferTarget?.nome || ''}`}
        loading={isTransferLoading}
        onTransfer={handleTransferBase}
        onClose={() => setTransferTarget(null)}
      />

      {/* Modal de Cadastro em Lote */}
      <Modal
        title="Cadastro de Equipes em Lote"
        open={isLoteModalOpen}
        onCancel={() => setIsLoteModalOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <EquipeLoteForm
          contratos={contratos || []}
          tiposEquipe={tiposEquipe || []}
          onSuccess={() => {
            setIsLoteModalOpen(false);
            equipes.mutate();
          }}
        />
      </Modal>
    </>
  );
}


// TODO: criar vinculo equipe x supervisor botao de alterar supervisor, aparece um form com a data de transicao, e o supervisor selecionado, ai ele encerra o vínculo atual e cria um novo com o supervisor selecionado
// ou seja, ao alterar o supervisor, ele encerra o vínculo atual e cria um novo com o supervisor selecionado
// o botao de alterar supervisor deve aparecer apenas se o vínculo ja existir
// o botao de alterar supervisor deve aparecer apenas se o vínculo ja existir
