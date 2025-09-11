'use client';

import { createEquipe } from '@/lib/actions/equipe/create';
import { deleteEquipe } from '@/lib/actions/equipe/delete';
import { listEquipes } from '@/lib/actions/equipe/list';
import { updateEquipe } from '@/lib/actions/equipe/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { Equipe } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

import EquipeForm, { EquipeFormData } from './form';

export default function EquipePage() {
  const controller = useCrudController<Equipe>('equipes');

  const equipes = useEntityData<Equipe>({
    key: 'equipes',
    fetcher: unwrapFetcher(listEquipes),
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

  const columns = useTableColumnsWithActions<Equipe>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Equipe>('nome', 'nome da equipe'),
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
    }
  );

  const handleSubmit = async (values: EquipeFormData) => {
    const action = async (): Promise<ActionResult<Equipe>> => {
      const equipe = controller.editingItem?.id
        ? await updateEquipe({ ...values, id: controller.editingItem.id })
        : await createEquipe(values);
      return { success: true, data: equipe.data };
    };

    controller.exec(action, 'Equipe salva com sucesso!').finally(() => {
      equipes.mutate();
    });
  };

  if (equipes.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar equipes.</p>;
  }

  return (
    <>
      <Card
        title="Equipes"
        extra={
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<Equipe>
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
    </>
  );
}

