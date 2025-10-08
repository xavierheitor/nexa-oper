'use client';

import { createTipoAtividade } from '@/lib/actions/tipoAtividade/create';
import { deleteTipoAtividade } from '@/lib/actions/tipoAtividade/delete';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { updateTipoAtividade } from '@/lib/actions/tipoAtividade/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Button, Card, Modal, Table } from 'antd';
import TipoAtividadeForm from './form';

export default function TipoAtividadePage() {
  const controller = useCrudController<any>('tipos-atividade');

  const tipos = useEntityData<any>({
    key: 'tipos-atividade',
    fetcher: unwrapFetcher(listTiposAtividade),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });

  const columns = useTableColumnsWithActions<any>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<any>('nome', 'nome') },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (d: any) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) => controller.exec(() => deleteTipoAtividade({ id: item.id }), 'Tipo excluído com sucesso!').finally(() => tipos.mutate()),
    }
  );

  const handleSubmit = async (values: { nome: string }) => {
    const action = async () => {
      const result = controller.editingItem?.id
        ? await updateTipoAtividade({ ...values, id: controller.editingItem.id })
        : await createTipoAtividade(values);
      return result;
    };
    controller.exec(action, 'Tipo salvo com sucesso!').finally(() => tipos.mutate());
  };

  if (tipos.error) return <p style={{ color: 'red' }}>Erro ao carregar tipos.</p>;

  return (
    <>
      <Card title="Tipos de Atividade" extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}>
        <Table columns={columns} dataSource={tipos.data} loading={tipos.isLoading} rowKey="id" pagination={tipos.pagination} onChange={tipos.handleTableChange} />
      </Card>

      <Modal title={controller.editingItem ? 'Editar Tipo' : 'Novo Tipo'} open={controller.isOpen} onCancel={controller.close} footer={null} destroyOnHidden width={600}>
        <TipoAtividadeForm initialValues={controller.editingItem ? { nome: controller.editingItem.nome } : undefined} onSubmit={handleSubmit} loading={controller.loading} />
      </Modal>
    </>
  );
}

