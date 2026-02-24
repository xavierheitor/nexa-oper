'use client';

import { createTipoChecklist } from '@/lib/actions/tipoChecklist/create';
import { deleteTipoChecklist } from '@/lib/actions/tipoChecklist/delete';
import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';
import { updateTipoChecklist } from '@/lib/actions/tipoChecklist/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoChecklist } from '@nexa-oper/db';
import TipoChecklistForm from '@/app/dashboard/cadastro/tipo-checklist/form';

interface TipoChecklistPageClientProps {
  initialData?: PaginatedResult<TipoChecklist>;
}

export default function TipoChecklistPageClient({
  initialData,
}: TipoChecklistPageClientProps) {
  const controller = useCrudController<TipoChecklist>('tipos-checklist');

  const tipos = useEntityData<TipoChecklist>({
    key: 'tipos-checklist',
    fetcherAction: unwrapFetcher(listTiposChecklist),
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
    createAction: createTipoChecklist,
    updateAction: updateTipoChecklist,
    onSuccess: () => tipos.mutate(),
    successMessage: 'Tipo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoChecklist>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<TipoChecklist>('nome', 'nome'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteTipoChecklist({ id: item.id }), 'Tipo excluido com sucesso!')
          .finally(() => tipos.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Checklist'
      entityKey='tipos-checklist'
      controller={controller}
      entityData={tipos}
      columns={columns}
      formComponent={TipoChecklistForm}
      onSubmit={handleSubmit}
    />
  );
}
