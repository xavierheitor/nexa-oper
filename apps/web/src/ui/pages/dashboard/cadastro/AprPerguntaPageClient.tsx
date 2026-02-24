'use client';

import { createAprPergunta } from '@/lib/actions/aprPergunta/create';
import { deleteAprPergunta } from '@/lib/actions/aprPergunta/delete';
import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';
import { updateAprPergunta } from '@/lib/actions/aprPergunta/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprPergunta } from '@nexa-oper/db';
import AprPerguntaForm from '@/ui/pages/dashboard/cadastro/apr-pergunta/form';

interface AprPerguntaPageClientProps {
  initialData?: PaginatedResult<AprPergunta>;
}

export default function AprPerguntaPageClient({
  initialData,
}: AprPerguntaPageClientProps) {
  const controller = useCrudController<AprPergunta>('apr-perguntas');

  const perguntas = useEntityData<AprPergunta>({
    key: 'apr-perguntas',
    fetcherAction: unwrapFetcher(listAprPerguntas),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createAprPergunta,
    updateAction: updateAprPergunta,
    onSuccess: () => perguntas.mutate(),
    successMessage: 'Pergunta salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<AprPergunta>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprPergunta>('nome', 'nome da pergunta'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteAprPergunta({ id: item.id }), 'Pergunta excluida com sucesso!')
          .finally(() => perguntas.mutate()),
    }
  );

  return (
    <CrudPage
      title='Perguntas APR'
      entityKey='apr-perguntas'
      controller={controller}
      entityData={perguntas}
      columns={columns}
      formComponent={AprPerguntaForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}
