'use client';

import { createChecklist } from '@/lib/actions/checklist/create';
import { deleteChecklist } from '@/lib/actions/checklist/delete';
import { getChecklist } from '@/lib/actions/checklist/get';
import { listChecklists } from '@/lib/actions/checklist/list';
import { updateChecklist } from '@/lib/actions/checklist/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Checklist } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import ChecklistForm, { ChecklistFormData } from './form';

export default function ChecklistPage() {
  const controller = useCrudController<Checklist>('checklists');

  const checklists = useEntityData<Checklist>({
    key: 'checklists',
    fetcher: unwrapFetcher(listChecklists),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        tipoChecklist: true,
        ChecklistPerguntaRelacao: true,
        ChecklistOpcaoRespostaRelacao: true,
      },
    },
  });

  const columns = useTableColumnsWithActions<Checklist>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<Checklist>('nome', 'nome') },
      { title: 'Tipo', dataIndex: ['tipoChecklist', 'nome'], key: 'tipoChecklist' },
      { title: 'Perguntas', key: 'perguntas', render: (_, r: any) => (r.ChecklistPerguntaRelacao || []).length, width: 120 },
      { title: 'Opções', key: 'opcoes', render: (_, r: any) => (r.ChecklistOpcaoRespostaRelacao || []).length, width: 120 },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onEdit: async (item) => {
        const res = await getChecklist({ id: (item as any).id });
        controller.open(res.data as any);
      },
      onDelete: (item) =>
        controller
          .exec(() => deleteChecklist({ id: (item as any).id }), 'Checklist excluído com sucesso!')
          .finally(() => checklists.mutate()),
    }
  );

  const handleSubmit = async (values: ChecklistFormData) => {
    const action = async (): Promise<ActionResult<Checklist>> => {
      const payload = controller.editingItem?.id
        ? await updateChecklist({ ...values, id: controller.editingItem.id })
        : await createChecklist(values);
      return { success: true, data: payload.data };
    };
    controller.exec(action, 'Checklist salvo com sucesso!').finally(() => checklists.mutate());
  };

  if (checklists.error) return <p style={{ color: 'red' }}>Erro ao carregar checklists.</p>;

  return (
    <>
      <Card title="Checklists" extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}>
        <Table<Checklist>
          columns={columns}
          dataSource={checklists.data}
          loading={checklists.isLoading}
          rowKey="id"
          pagination={checklists.pagination}
          onChange={checklists.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Checklist' : 'Novo Checklist'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <ChecklistForm initialValues={controller.editingItem as any} onSubmit={handleSubmit} loading={controller.loading} />
      </Modal>
    </>
  );
}

