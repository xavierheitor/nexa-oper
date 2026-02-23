'use client';

import { createTipoChecklist } from '@/lib/actions/tipoChecklist/create';
import { deleteTipoChecklist } from '@/lib/actions/tipoChecklist/delete';
import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';
import { updateTipoChecklist } from '@/lib/actions/tipoChecklist/update';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import CrudPage from '@/lib/components/CrudPage';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoChecklist } from '@nexa-oper/db';
import TipoChecklistForm from './form';

export default function TipoChecklistPage() {
  const controller = useCrudController<TipoChecklist>('tipos-checklist');

  const tipos = useEntityData<TipoChecklist>({
    key: 'tipos-checklist',
    fetcherAction: unwrapFetcher(listTiposChecklist),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });

  // Handler padronizado para forms CRUD
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
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<TipoChecklist>('nome', 'nome') },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) => controller
        .exec(() => deleteTipoChecklist({ id: item.id }), 'Tipo excluído com sucesso!')
        .finally(() => tipos.mutate()),
    }
  );

  return (
    <CrudPage
      title="Tipos de Checklist"
      entityKey="tipos-checklist"
      controller={controller}
      entityData={tipos}
      columns={columns}
      formComponent={TipoChecklistForm}
      onSubmit={handleSubmit}
    />
  );
}
