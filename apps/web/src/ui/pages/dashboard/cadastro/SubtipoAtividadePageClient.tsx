'use client';

import { createTipoAtividadeServico } from '@/lib/actions/tipoAtividadeServico/create';
import { deleteTipoAtividadeServico } from '@/lib/actions/tipoAtividadeServico/delete';
import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import { updateTipoAtividadeServico } from '@/lib/actions/tipoAtividadeServico/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { TipoAtividade, TipoAtividadeServico } from '@nexa-oper/db';
import SubtipoAtividadeForm from '@/ui/pages/dashboard/cadastro/subtipo-atividade/form';

type TipoAtividadeServicoRow = TipoAtividadeServico & {
  atividadeTipo?: Pick<TipoAtividade, 'id' | 'nome'>;
};

interface SubtipoAtividadePageClientProps {
  initialData?: PaginatedResult<TipoAtividadeServicoRow>;
}

export default function SubtipoAtividadePageClient({
  initialData,
}: SubtipoAtividadePageClientProps) {
  const controller = useCrudController<TipoAtividadeServicoRow>(
    'subtipos-atividade'
  );

  const subtipos = useEntityData<TipoAtividadeServicoRow>({
    key: 'subtipos-atividade',
    fetcherAction: unwrapFetcher(listTiposAtividadeServico),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { atividadeTipo: true },
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createTipoAtividadeServico,
    updateAction: updateTipoAtividadeServico,
    onSuccess: () => subtipos.mutate(),
    successMessage: 'Subtipo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoAtividadeServicoRow>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Subtipo',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<TipoAtividadeServicoRow>('nome', 'subtipo'),
      },
      {
        title: 'Tipo de Atividade',
        dataIndex: ['atividadeTipo', 'nome'],
        key: 'atividadeTipoNome',
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (d: Date | string) => new Date(d).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteTipoAtividadeServico({ id: item.id }),
            'Subtipo excluído com sucesso!'
          )
          .finally(() => subtipos.mutate()),
    }
  );

  return (
    <CrudPage
      title='Subtipos de Atividade'
      entityKey='subtipos-atividade'
      controller={controller}
      entityData={subtipos}
      columns={columns}
      formComponent={SubtipoAtividadeForm}
      onSubmit={handleSubmit}
    />
  );
}
