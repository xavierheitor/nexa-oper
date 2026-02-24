'use client';

import { createTipoEquipe } from '@/lib/actions/tipoEquipe/create';
import { deleteTipoEquipe } from '@/lib/actions/tipoEquipe/delete';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { updateTipoEquipe } from '@/lib/actions/tipoEquipe/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoEquipe } from '@nexa-oper/db';
import TipoEquipeForm from '@/app/dashboard/cadastro/tipo-equipe/form';

interface TipoEquipePageClientProps {
  initialData?: PaginatedResult<TipoEquipe>;
}

export default function TipoEquipePageClient({
  initialData,
}: TipoEquipePageClientProps) {
  const controller = useCrudController<TipoEquipe>('tipos-equipe');

  const tiposEquipe = useEntityData<TipoEquipe>({
    key: 'tipos-equipe',
    fetcherAction: unwrapFetcher(listTiposEquipe),
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
    createAction: createTipoEquipe,
    updateAction: updateTipoEquipe,
    onSuccess: () => tiposEquipe.mutate(),
    successMessage: 'Tipo de equipe salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoEquipe>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<TipoEquipe>('nome', 'nome do tipo de equipe'),
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
          .exec(
            () => deleteTipoEquipe({ id: item.id }),
            'Tipo de equipe excluido com sucesso!'
          )
          .finally(() => tiposEquipe.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Equipe'
      entityKey='tipos-equipe'
      controller={controller}
      entityData={tiposEquipe}
      columns={columns}
      formComponent={TipoEquipeForm}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
