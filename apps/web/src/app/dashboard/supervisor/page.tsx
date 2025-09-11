'use client';

import { createSupervisor } from '@/lib/actions/supervisor/create';
import { deleteSupervisor } from '@/lib/actions/supervisor/delete';
import { listSupervisores } from '@/lib/actions/supervisor/list';
import { updateSupervisor } from '@/lib/actions/supervisor/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { Supervisor } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

import SupervisorForm, { SupervisorFormData } from './form';

export default function SupervisorPage() {
  const controller = useCrudController<Supervisor>('supervisores');

  const supervisores = useEntityData<Supervisor>({
    key: 'supervisores',
    fetcher: unwrapFetcher(listSupervisores),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
      },
    },
  });

  const columns = useTableColumnsWithActions<Supervisor>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Supervisor>('nome', 'nome do supervisor'),
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
          .exec(
            () => deleteSupervisor({ id: item.id }),
            'Supervisor excluído com sucesso!'
          )
          .finally(() => {
            supervisores.mutate();
          }),
    }
  );

  const handleSubmit = async (values: SupervisorFormData) => {
    const action = async (): Promise<ActionResult<Supervisor>> => {
      const supervisor = controller.editingItem?.id
        ? await updateSupervisor({ ...values, id: controller.editingItem.id })
        : await createSupervisor(values);
      return { success: true, data: supervisor.data };
    };

    controller.exec(action, 'Supervisor salvo com sucesso!').finally(() => {
      supervisores.mutate();
    });
  };

  if (supervisores.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar supervisores.</p>;
  }

  return (
    <>
      <Card
        title="Supervisores"
        extra={
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<Supervisor>
          columns={columns}
          dataSource={supervisores.data}
          loading={supervisores.isLoading}
          rowKey="id"
          pagination={supervisores.pagination}
          onChange={supervisores.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Supervisor' : 'Novo Supervisor'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <SupervisorForm
          initialValues={
            controller.editingItem
              ? {
                  nome: controller.editingItem.nome,
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

