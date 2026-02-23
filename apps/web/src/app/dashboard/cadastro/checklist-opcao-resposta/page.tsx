'use client';

import { createChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/create';
import { deleteChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/delete';
import { listChecklistOpcoesResposta } from '@/lib/actions/checklistOpcaoResposta/list';
import { updateChecklistOpcaoResposta } from '@/lib/actions/checklistOpcaoResposta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ChecklistOpcaoResposta } from '@nexa-oper/db';
import ChecklistOpcaoRespostaForm from './form';

export default function ChecklistOpcaoRespostaPage() {
  const controller = useCrudController<ChecklistOpcaoResposta>('checklist-opcoes-resposta');

  const opcoesResposta = useEntityData<ChecklistOpcaoResposta>({
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

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createChecklistOpcaoResposta,
    updateAction: updateChecklistOpcaoResposta,
    onSuccess: () => opcoesResposta.mutate(),
    successMessage: 'Opção de resposta salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<ChecklistOpcaoResposta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ChecklistOpcaoResposta>('nome', 'nome da opção'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteChecklistOpcaoResposta({ id: item.id }), 'Opção de resposta excluída com sucesso!')
          .finally(() => opcoesResposta.mutate()),
    }
  );

  return (
    <CrudPage
      title="Opções de Resposta de Checklist"
      entityKey="checklist-opcoes-resposta"
      controller={controller}
      entityData={opcoesResposta}
      columns={columns}
      formComponent={ChecklistOpcaoRespostaForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}
