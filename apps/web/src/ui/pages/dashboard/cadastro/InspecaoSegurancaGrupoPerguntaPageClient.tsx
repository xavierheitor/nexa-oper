'use client';

import { createInspecaoSegurancaGrupoPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/create';
import { deleteInspecaoSegurancaGrupoPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/delete';
import { getInspecaoSegurancaGrupoPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/get';
import { listInspecaoSegurancaGruposPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/list';
import { updateInspecaoSegurancaGrupoPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { InspecaoSegurancaGrupoPergunta } from '@nexa-oper/db';
import InspecaoSegurancaGrupoPerguntaForm, { InspecaoSegurancaGrupoPerguntaFormData } from './inspecao-seguranca-grupo-pergunta/form';

type GrupoRow = InspecaoSegurancaGrupoPergunta & {
  perguntasRelacao?: unknown[];
  opcoesRelacao?: unknown[];
};

export default function InspecaoSegurancaGrupoPerguntaPageClient({
  initialData,
}: {
  initialData?: PaginatedResult<InspecaoSegurancaGrupoPergunta>;
}) {
  const controller = useCrudController<InspecaoSegurancaGrupoPergunta>('inspecao-seguranca-grupos');
  const grupos = useEntityData<InspecaoSegurancaGrupoPergunta>({
    key: 'inspecao-seguranca-grupos',
    fetcherAction: unwrapFetcher(listInspecaoSegurancaGruposPergunta),
    paginationEnabled: true,
    initialData,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });
  const handleSubmit = useCrudFormHandler<InspecaoSegurancaGrupoPerguntaFormData, InspecaoSegurancaGrupoPergunta>({
    controller,
    createAction: createInspecaoSegurancaGrupoPergunta,
    updateAction: updateInspecaoSegurancaGrupoPergunta,
    onSuccess: () => grupos.mutate(),
    successMessage: 'Grupo salvo com sucesso!',
  });
  const columns = useTableColumnsWithActions<InspecaoSegurancaGrupoPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Grupo', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<InspecaoSegurancaGrupoPergunta>('nome', 'grupo') },
      { title: 'Tipo', dataIndex: 'tipoResposta', key: 'tipoResposta', sorter: true, width: 140 },
      { title: 'Perguntas', key: 'perguntas', render: (_, row: GrupoRow) => row.perguntasRelacao?.length ?? 0, width: 120 },
      { title: 'Opções', key: 'opcoes', render: (_, row: GrupoRow) => row.opcoesRelacao?.length ?? 0, width: 120 },
    ],
    {
      onEdit: async item => {
        const res = await getInspecaoSegurancaGrupoPergunta({ id: item.id });
        controller.open((res.data || item) as InspecaoSegurancaGrupoPergunta);
      },
      onDelete: item => controller.exec(() => deleteInspecaoSegurancaGrupoPergunta({ id: item.id }), 'Grupo excluído com sucesso!').finally(() => grupos.mutate()),
    }
  );
  return <CrudPage<InspecaoSegurancaGrupoPergunta, InspecaoSegurancaGrupoPerguntaFormData> title='Grupos de Inspeção' entityKey='inspecao-seguranca-grupos' controller={controller} entityData={grupos} columns={columns} formComponent={InspecaoSegurancaGrupoPerguntaForm} onSubmit={handleSubmit} modalWidth={1000} />;
}
