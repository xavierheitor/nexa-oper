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

import { EquipeSupervisor, Supervisor } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

import SupervisorForm, { SupervisorFormData } from './form';
import VinculoForm from './vinculoForm';
import { listEquipesSupervisores } from '@/lib/actions/equipeSupervisor/list';
import { createEquipeSupervisor } from '@/lib/actions/equipeSupervisor/create';
import { updateEquipeSupervisor } from '@/lib/actions/equipeSupervisor/update';
import { deleteEquipeSupervisor } from '@/lib/actions/equipeSupervisor/delete';
import { closeEquipeSupervisor } from '@/lib/actions/equipeSupervisor/close';

export default function SupervisorPage() {
  const controller = useCrudController<Supervisor>('supervisores');
  const vinculoController = useCrudController<EquipeSupervisor>('equipes-supervisores');

  const supervisores = useEntityData<Supervisor>({
    key: 'supervisores',
    fetcherAction: unwrapFetcher(listSupervisores),
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

  const vinculos = useEntityData<EquipeSupervisor>({
    key: 'equipes-supervisores',
    fetcherAction: unwrapFetcher(listEquipesSupervisores),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { supervisor: true, equipe: true },
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

  const columnsVinculo = useTableColumnsWithActions<EquipeSupervisor>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Supervisor',
        dataIndex: ['supervisor', 'nome'],
        key: 'supervisor',
      },
      {
        title: 'Equipe',
        dataIndex: ['equipe', 'nome'],
        key: 'equipe',
      },
      {
        title: 'Início',
        dataIndex: 'inicio',
        key: 'inicio',
        sorter: true,
        render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'),
      },
      {
        title: 'Fim',
        dataIndex: 'fim',
        key: 'fim',
        render: (d?: Date | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '-'),
      },
    ],
    {
      onEdit: vinculoController.open,
      onDelete: (item) =>
        vinculoController
          .exec(
            () => deleteEquipeSupervisor({ id: item.id }),
            'Vínculo excluído com sucesso!'
          )
          .finally(() => vinculos.mutate()),
      customActions: [
        {
          key: 'close-today',
          label: 'Encerrar hoje',
          type: 'link',
          visible: (item) => !(item as any).fim,
          confirm: {
            title: 'Encerrar vínculo',
            description: 'Deseja encerrar o vínculo na data de hoje?',
            okText: 'Encerrar',
            cancelText: 'Cancelar',
          },
          onClick: (item) =>
            vinculoController
              .exec(
                () => closeEquipeSupervisor({ id: (item as any).id }),
                'Vínculo encerrado com sucesso!'
              )
              .finally(() => vinculos.mutate()),
        },
      ],
    }
  );

  const handleSubmit = async (values: SupervisorFormData) => {
    const action = async (): Promise<ActionResult<Supervisor>> => {
      const result = controller.editingItem?.id
        ? await updateSupervisor({ ...values, id: controller.editingItem.id })
        : await createSupervisor(values);
      return result;
    };

    controller.exec(action, 'Supervisor salvo com sucesso!').finally(() => {
      supervisores.mutate();
    });
  };

  const handleSubmitVinculo = async (values: { supervisorId: number; equipeId: number; inicio: Date; fim?: Date | null }) => {
    const action = async (): Promise<ActionResult<EquipeSupervisor>> => {
      const result = vinculoController.editingItem?.id
        ? await updateEquipeSupervisor({ ...values, id: vinculoController.editingItem.id })
        : await createEquipeSupervisor(values);
      return result;
    };
    vinculoController.exec(action, 'Vínculo salvo com sucesso!').finally(() => vinculos.mutate());
  };

  if (supervisores.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar supervisores.</p>;
  }
  if (vinculos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar vínculos Equipe-Supervisor.</p>;
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

      <Card
        title="Vínculo Equipe x Supervisor"
        style={{ marginTop: 16 }}
        extra={
          <Button type="primary" onClick={() => vinculoController.open()}>
            Adicionar vínculo
          </Button>
        }
      >
        <Table<EquipeSupervisor>
          columns={columnsVinculo}
          dataSource={vinculos.data}
          loading={vinculos.isLoading}
          rowKey="id"
          pagination={vinculos.pagination}
          onChange={vinculos.handleTableChange}
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

      <Modal
        title={vinculoController.editingItem ? 'Editar Vínculo' : 'Novo Vínculo'}
        open={vinculoController.isOpen}
        onCancel={vinculoController.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <VinculoForm
          initialValues={
            vinculoController.editingItem
              ? {
                  supervisorId: (vinculoController.editingItem as any).supervisorId,
                  equipeId: (vinculoController.editingItem as any).equipeId,
                  inicio: vinculoController.editingItem.inicio as any,
                  fim: (vinculoController.editingItem as any).fim as any,
                }
              : undefined
          }
          onSubmit={handleSubmitVinculo}
          loading={vinculoController.loading}
        />
      </Modal>
    </>
  );
}
