'use client';

import { createTipoChecklist } from '@/lib/actions/tipoChecklist/create';
import { deleteTipoChecklist } from '@/lib/actions/tipoChecklist/delete';
import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';
import { updateTipoChecklist } from '@/lib/actions/tipoChecklist/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Button, Card, Modal, Table } from 'antd';
import TipoChecklistForm from './form';

export default function TipoChecklistPage() {
  const controller = useCrudController<any>('tipos-checklist');

  const tipos = useEntityData<any>({
    key: 'tipos-checklist',
    fetcher: unwrapFetcher(listTiposChecklist),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });

  const columns = useTableColumnsWithActions<any>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<any>('nome', 'nome') },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) => controller
        .exec(() => deleteTipoChecklist({ id: item.id }), 'Tipo excluído com sucesso!')
        .finally(() => tipos.mutate()),
    }
  );

  const handleSubmit = async (values: { nome: string }) => {
    const action = async () => {
      const result = controller.editingItem?.id
        ? await updateTipoChecklist({ ...values, id: controller.editingItem.id })
        : await createTipoChecklist(values);
      return result;
    };
    controller.exec(action, 'Tipo salvo com sucesso!').finally(() => tipos.mutate());
  };

  if (tipos.error) return <p style={{ color: 'red' }}>Erro ao carregar tipos.</p>;

  return (
    <>
      <Card title="Tipos de Checklist" extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}>
        <Table columns={columns} dataSource={tipos.data} loading={tipos.isLoading} rowKey="id" pagination={tipos.pagination} onChange={tipos.handleTableChange} />
      </Card>

      <Modal title={controller.editingItem ? 'Editar Tipo' : 'Novo Tipo'} open={controller.isOpen} onCancel={controller.close} footer={null} destroyOnHidden width={600}>
        <TipoChecklistForm initialValues={controller.editingItem ? { nome: controller.editingItem.nome } : undefined} onSubmit={handleSubmit} loading={controller.loading} />
      </Modal>
    </>
  );
}
