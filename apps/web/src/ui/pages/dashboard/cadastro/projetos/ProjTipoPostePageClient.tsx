'use client';

import { createProjTipoPoste } from '@/lib/actions/projTipoPoste/create';
import { deleteProjTipoPoste } from '@/lib/actions/projTipoPoste/delete';
import { listProjTiposPoste } from '@/lib/actions/projTipoPoste/list';
import { updateProjTipoPoste } from '@/lib/actions/projTipoPoste/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { ProjTipoPoste } from '@nexa-oper/db';
import CatalogoProjetoNomeForm from './CatalogoProjetoNomeForm';

interface ProjTipoPostePageClientProps {
  initialData?: PaginatedResult<ProjTipoPoste>;
}

export default function ProjTipoPostePageClient({
  initialData,
}: ProjTipoPostePageClientProps) {
  const controller = useCrudController<ProjTipoPoste>('proj-tipos-poste');

  const tiposPoste = useEntityData<ProjTipoPoste>({
    key: 'proj-tipos-poste',
    fetcherAction: unwrapFetcher(listProjTiposPoste),
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
    createAction: createProjTipoPoste,
    updateAction: updateProjTipoPoste,
    onSuccess: () => tiposPoste.mutate(),
    successMessage: 'Tipo de poste salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjTipoPoste>(
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
        ...getTextFilter<ProjTipoPoste>('nome', 'nome do tipo de poste'),
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
            () => deleteProjTipoPoste({ id: item.id }),
            'Tipo de poste excluído com sucesso!'
          )
          .finally(() => tiposPoste.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Poste'
      entityKey='proj-tipos-poste'
      controller={controller}
      entityData={tiposPoste}
      columns={columns}
      formComponent={(props) => (
        <CatalogoProjetoNomeForm
          {...props}
          label='Nome do Tipo de Poste'
          placeholder='Digite o nome do tipo de poste (ex: 12/300)'
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
