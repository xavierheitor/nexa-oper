'use client';

import { createContrato } from '@/lib/actions/contrato/create';
import { deleteContrato } from '@/lib/actions/contrato/delete';
import { listContratos } from '@/lib/actions/contrato/list';
import { updateContrato } from '@/lib/actions/contrato/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { Contrato } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import ContratoForm, { ContratoFormData } from './form';

export default function ContratoPage() {
  const controller = useCrudController<Contrato>('contratos');

  const contratos = useEntityData<Contrato>({
    key: 'contratos',
    fetcher: unwrapFetcher(listContratos),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const columns = useTableColumnsWithActions<Contrato>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
      },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
      },
      {
        title: 'Número',
        dataIndex: 'numero',
        key: 'numero',
        sorter: true,
      }
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteContrato({ id: item.id }), 'Contrato excluído com sucesso!')
          .finally(() => {
            contratos.mutate();
          }),
    },
  );

  const handleSubmit = async (values: ContratoFormData) => {
    const action = async (): Promise<ActionResult<Contrato>> => {
      const contrato = controller.editingItem?.id
        ? await updateContrato({
          ...values,
          id: controller.editingItem.id,
        })
        : await createContrato(values);

      return { success: true, data: contrato.data };
    };

    controller.exec(action, 'Contrato salvo com sucesso!').finally(() => {
      contratos.mutate();
    });
  };

  if (contratos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar contratos.</p>;
  }

  return (
    <>
      <Card
        title="Contratos"
        extra={
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<Contrato>
          columns={columns}
          dataSource={contratos.data}
          loading={contratos.isLoading}
          rowKey="id"
          pagination={contratos.pagination}
          onChange={contratos.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Contrato' : 'Novo Contrato'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <ContratoForm
          initialValues={controller.editingItem ? {
            nome: controller.editingItem.nome,
            numero: controller.editingItem.numero,
            dataInicio: controller.editingItem.dataInicio,
            dataFim: controller.editingItem.dataFim,
          } : undefined}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}