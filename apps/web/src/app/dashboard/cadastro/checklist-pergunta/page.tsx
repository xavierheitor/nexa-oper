'use client';

import { createChecklistPergunta } from '@/lib/actions/checklistPergunta/create';
import { deleteChecklistPergunta } from '@/lib/actions/checklistPergunta/delete';
import { listChecklistPerguntas } from '@/lib/actions/checklistPergunta/list';
import { updateChecklistPergunta } from '@/lib/actions/checklistPergunta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ChecklistPergunta } from '@nexa-oper/db';
import ChecklistPerguntaForm from './form';

export default function ChecklistPerguntaPage() {
  const controller = useCrudController<ChecklistPergunta>('checklist-perguntas');

  const perguntas = useEntityData<ChecklistPergunta>({
    key: 'checklist-perguntas',
    fetcherAction: unwrapFetcher(listChecklistPerguntas),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createChecklistPergunta,
    updateAction: updateChecklistPergunta,
    onSuccess: () => perguntas.mutate(),
    successMessage: 'Pergunta salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<ChecklistPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ChecklistPergunta>('nome', 'nome da pergunta'),
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

  return (
    <CrudPage
      title="Perguntas de Checklist"
      entityKey="checklist-perguntas"
      controller={controller}
      entityData={perguntas}
      columns={columns}
      formComponent={ChecklistPerguntaForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}
