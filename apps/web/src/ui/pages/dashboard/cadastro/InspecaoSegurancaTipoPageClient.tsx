'use client';

import { createInspecaoSegurancaTipo } from '@/lib/actions/inspecaoSegurancaTipo/create';
import { deleteInspecaoSegurancaTipo } from '@/lib/actions/inspecaoSegurancaTipo/delete';
import { listInspecaoSegurancaTipos } from '@/lib/actions/inspecaoSegurancaTipo/list';
import { updateInspecaoSegurancaTipo } from '@/lib/actions/inspecaoSegurancaTipo/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { InspecaoSegurancaTipo } from '@nexa-oper/db';
import InspecaoSegurancaTipoForm, { InspecaoSegurancaTipoFormData } from './inspecao-seguranca-tipo/form';

export default function InspecaoSegurancaTipoPageClient({
  initialData,
}: {
  initialData?: PaginatedResult<InspecaoSegurancaTipo>;
}) {
  const controller = useCrudController<InspecaoSegurancaTipo>('inspecao-seguranca-tipos');
  const tipos = useEntityData<InspecaoSegurancaTipo>({
    key: 'inspecao-seguranca-tipos',
    fetcherAction: unwrapFetcher(listInspecaoSegurancaTipos),
    paginationEnabled: true,
    initialData,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });
  const handleSubmit = useCrudFormHandler<InspecaoSegurancaTipoFormData, InspecaoSegurancaTipo>({
    controller,
    createAction: createInspecaoSegurancaTipo,
    updateAction: updateInspecaoSegurancaTipo,
    onSuccess: () => tipos.mutate(),
    successMessage: 'Tipo de inspeção salvo com sucesso!',
  });
  const columns = useTableColumnsWithActions<InspecaoSegurancaTipo>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<InspecaoSegurancaTipo>('nome', 'nome') },
      { title: 'Chave', dataIndex: 'chave', key: 'chave', sorter: true },
      { title: 'Contexto', dataIndex: 'contexto', key: 'contexto', sorter: true },
    ],
    {
      onEdit: controller.open,
      onDelete: item => controller.exec(() => deleteInspecaoSegurancaTipo({ id: item.id }), 'Tipo excluído com sucesso!').finally(() => tipos.mutate()),
    }
  );
  return <CrudPage<InspecaoSegurancaTipo, InspecaoSegurancaTipoFormData> title='Tipos de Inspeção' entityKey='inspecao-seguranca-tipos' controller={controller} entityData={tipos} columns={columns} formComponent={InspecaoSegurancaTipoForm} onSubmit={handleSubmit} modalWidth={700} />;
}
