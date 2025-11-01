'use client';

import { createChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/create';
import { deleteChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/delete';
import { listChecklistOpcoesResposta } from '@/lib/actions/checklistOpcaoResposta/list';
import { updateChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ChecklistOpcaoResposta } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag } from 'antd';
import ChecklistOpcaoRespostaForm, { ChecklistOpcaoRespostaFormData } from './form';

export default function ChecklistOpcaoRespostaPage() {
  const controller = useCrudController<ChecklistOpcaoResposta>('checklist-opcoes-resposta');

  const opcoes = useEntityData<ChecklistOpcaoResposta>({
    key: 'checklist-opcoes-resposta',
    fetcherAction: unwrapFetcher(listChecklistOpcoesResposta),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const columns = useTableColumnsWithActions<ChecklistOpcaoResposta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Opção',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ChecklistOpcaoResposta>('nome', 'opção'),
      },
      {
        title: 'Gera Pendência',
        dataIndex: 'geraPendencia',
        key: 'geraPendencia',
        width: 140,
        render: (v: boolean) => (
          <Tag color={v ? 'red' : 'green'}>{v ? 'Sim' : 'Não'}</Tag>
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
          .exec(() => deleteChecklistOpcaoResposta({ id: item.id }), 'Opção excluída com sucesso!')
          .finally(() => opcoes.mutate()),
    }
  );

  const handleSubmit = async (values: ChecklistOpcaoRespostaFormData) => {
    const action = async (): Promise<ActionResult<ChecklistOpcaoResposta>> => {
      const result = controller.editingItem?.id
        ? await updateChecklistOpcaoResposta({ ...values, id: controller.editingItem.id })
        : await createChecklistOpcaoResposta(values);
      return result;
    };
    controller.exec(action, 'Opção salva com sucesso!').finally(() => opcoes.mutate());
  };

  if (opcoes.error) return <p style={{ color: 'red' }}>Erro ao carregar opções.</p>;

  return (
    <>
      <Card
        title="Opções de Resposta do Checklist"
        extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}
      >
        <Table<ChecklistOpcaoResposta>
          columns={columns}
          dataSource={opcoes.data}
          loading={opcoes.isLoading}
          rowKey="id"
          pagination={opcoes.pagination}
          onChange={opcoes.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Opção' : 'Nova Opção'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <ChecklistOpcaoRespostaForm
          initialValues={
            controller.editingItem
              ? { nome: controller.editingItem.nome, geraPendencia: controller.editingItem.geraPendencia }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
