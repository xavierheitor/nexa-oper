'use client';

import { createChecklistPergunta } from '@/lib/actions/checklistPergunta/create';
import { deleteChecklistPergunta } from '@/lib/actions/checklistPergunta/delete';
import { listChecklistPerguntas } from '@/lib/actions/checklistPergunta/list';
import { updateChecklistPergunta } from '@/lib/actions/checklistPergunta/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ChecklistPergunta } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import ChecklistPerguntaForm, { ChecklistPerguntaFormData } from './form';

export default function ChecklistPerguntaPage() {
  const controller = useCrudController<ChecklistPergunta>('checklist-perguntas');

  const perguntas = useEntityData<ChecklistPergunta>({
    key: 'checklist-perguntas',
    fetcher: unwrapFetcher(listChecklistPerguntas),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const columns = useTableColumnsWithActions<ChecklistPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Pergunta',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ChecklistPergunta>('nome', 'pergunta'),
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
          .exec(() => deleteChecklistPergunta({ id: item.id }), 'Pergunta excluída com sucesso!')
          .finally(() => perguntas.mutate()),
    }
  );

  const handleSubmit = async (values: ChecklistPerguntaFormData) => {
    const action = async (): Promise<ActionResult<ChecklistPergunta>> => {
      const result = controller.editingItem?.id
        ? await updateChecklistPergunta({ ...values, id: controller.editingItem.id })
        : await createChecklistPergunta(values);
      return result;
    };
    controller.exec(action, 'Pergunta salva com sucesso!').finally(() => perguntas.mutate());
  };

  if (perguntas.error) return <p style={{ color: 'red' }}>Erro ao carregar perguntas.</p>;

  return (
    <>
      <Card
        title="Perguntas do Checklist"
        extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}
      >
        <Table<ChecklistPergunta>
          columns={columns}
          dataSource={perguntas.data}
          loading={perguntas.isLoading}
          rowKey="id"
          pagination={perguntas.pagination}
          onChange={perguntas.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Pergunta' : 'Nova Pergunta'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <ChecklistPerguntaForm
          initialValues={controller.editingItem ? { nome: controller.editingItem.nome } : undefined}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}

