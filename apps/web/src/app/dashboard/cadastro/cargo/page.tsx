/**
 * Página de Gerenciamento de Cargos
 */

'use client';

import { createCargo } from '@/lib/actions/cargo/create';
import { deleteCargo } from '@/lib/actions/cargo/delete';
import { listCargos } from '@/lib/actions/cargo/list';
import { updateCargo } from '@/lib/actions/cargo/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { Cargo } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag } from 'antd';

import CargoForm, { CargoFormData } from './form';

export default function CargoPage() {
  const controller = useCrudController<Cargo>('cargos');

  const cargos = useEntityData<Cargo>({
    key: 'cargos',
    fetcherAction: unwrapFetcher(listCargos),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const columns = useTableColumnsWithActions<Cargo>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Cargo>('nome', 'nome do cargo'),
      },
      {
        title: 'Salário Base',
        dataIndex: 'salarioBase',
        key: 'salarioBase',
        sorter: true,
        render: (valor: number) =>
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(valor),
        width: 150,
      },
      {
        title: 'Eletricistas',
        key: 'eletricistas',
        width: 120,
        render: (_: unknown, record: any) => (
          <Tag color="blue">
            {record._count?.Eletricista || 0}
          </Tag>
        ),
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
          .exec(() => deleteCargo({ id: item.id }), 'Cargo excluído com sucesso!')
          .finally(() => {
            cargos.mutate();
          }),
    }
  );

  const handleSubmit = async (values: CargoFormData) => {
    const action = async (): Promise<ActionResult<Cargo>> => {
      const result = controller.editingItem?.id
        ? await updateCargo({ ...values, id: controller.editingItem.id })
        : await createCargo(values);
      return result;
    };

    controller.exec(action, 'Cargo salvo com sucesso!').finally(() => {
      cargos.mutate();
    });
  };

  if (cargos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar cargos.</p>;
  }

  return (
    <>
      <Card
        title="Cargos"
        extra={
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<Cargo>
          columns={columns}
          dataSource={cargos.data}
          loading={cargos.isLoading}
          rowKey="id"
          pagination={cargos.pagination}
          onChange={cargos.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Cargo' : 'Novo Cargo'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={500}
      >
        <CargoForm
          initialValues={
            controller.editingItem
              ? {
                  nome: controller.editingItem.nome,
                  salarioBase: controller.editingItem.salarioBase,
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

