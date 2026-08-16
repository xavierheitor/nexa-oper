'use client';

import { createInspecaoSegurancaPergunta } from '@/lib/actions/inspecaoSegurancaPergunta/create';
import { deleteInspecaoSegurancaPergunta } from '@/lib/actions/inspecaoSegurancaPergunta/delete';
import { listInspecaoSegurancaPerguntas } from '@/lib/actions/inspecaoSegurancaPergunta/list';
import { updateInspecaoSegurancaPergunta } from '@/lib/actions/inspecaoSegurancaPergunta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { InspecaoSegurancaPergunta } from '@nexa-oper/db';
import InspecaoSegurancaPerguntaForm, { InspecaoSegurancaPerguntaFormData } from './inspecao-seguranca-pergunta/form';

export default function InspecaoSegurancaPerguntaPageClient({
  initialData,
}: {
  initialData?: PaginatedResult<InspecaoSegurancaPergunta>;
}) {
  const controller = useCrudController<InspecaoSegurancaPergunta>('inspecao-seguranca-perguntas');
  const perguntas = useEntityData<InspecaoSegurancaPergunta>({
    key: 'inspecao-seguranca-perguntas',
    fetcherAction: unwrapFetcher(listInspecaoSegurancaPerguntas),
    paginationEnabled: true,
    initialData,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });
  const handleSubmit = useCrudFormHandler<InspecaoSegurancaPerguntaFormData, InspecaoSegurancaPergunta>({
    controller,
    createAction: createInspecaoSegurancaPergunta,
    updateAction: updateInspecaoSegurancaPergunta,
    onSuccess: () => perguntas.mutate(),
    successMessage: 'Pergunta salva com sucesso!',
  });
  const columns = useTableColumnsWithActions<InspecaoSegurancaPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Pergunta', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<InspecaoSegurancaPergunta>('nome', 'pergunta') },
      { title: 'Obrigatória', dataIndex: 'obrigatoria', key: 'obrigatoria', render: (v: boolean) => (v ? 'Sim' : 'Não'), width: 120 },
    ],
    {
      onEdit: controller.open,
      onDelete: item => controller.exec(() => deleteInspecaoSegurancaPergunta({ id: item.id }), 'Pergunta excluída com sucesso!').finally(() => perguntas.mutate()),
    }
  );
  return <CrudPage<InspecaoSegurancaPergunta, InspecaoSegurancaPerguntaFormData> title='Perguntas de Inspeção' entityKey='inspecao-seguranca-perguntas' controller={controller} entityData={perguntas} columns={columns} formComponent={InspecaoSegurancaPerguntaForm} onSubmit={handleSubmit} modalWidth={700} />;
}
