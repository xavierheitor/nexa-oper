'use client';

import { createInspecaoSegurancaModelo } from '@/lib/actions/inspecaoSegurancaModelo/create';
import { deleteInspecaoSegurancaModelo } from '@/lib/actions/inspecaoSegurancaModelo/delete';
import { getInspecaoSegurancaModelo } from '@/lib/actions/inspecaoSegurancaModelo/get';
import { listInspecaoSegurancaModelos } from '@/lib/actions/inspecaoSegurancaModelo/list';
import { updateInspecaoSegurancaModelo } from '@/lib/actions/inspecaoSegurancaModelo/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { InspecaoSegurancaModelo } from '@nexa-oper/db';
import InspecaoSegurancaModeloForm, { InspecaoSegurancaModeloFormData } from './inspecao-seguranca-modelo/form';

type ModeloRow = InspecaoSegurancaModelo & {
  tipo?: { nome: string; contexto: string } | null;
  gruposRelacao?: unknown[];
};

export default function InspecaoSegurancaModeloPageClient({
  initialData,
}: {
  initialData?: PaginatedResult<InspecaoSegurancaModelo>;
}) {
  const controller = useCrudController<InspecaoSegurancaModelo>('inspecao-seguranca-modelos');
  const modelos = useEntityData<InspecaoSegurancaModelo>({
    key: 'inspecao-seguranca-modelos',
    fetcherAction: unwrapFetcher(listInspecaoSegurancaModelos),
    paginationEnabled: true,
    initialData,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc' },
  });
  const handleSubmit = useCrudFormHandler<InspecaoSegurancaModeloFormData, InspecaoSegurancaModelo>({
    controller,
    createAction: createInspecaoSegurancaModelo,
    updateAction: updateInspecaoSegurancaModelo,
    onSuccess: () => modelos.mutate(),
    successMessage: 'Modelo salvo com sucesso!',
  });
  const columns = useTableColumnsWithActions<InspecaoSegurancaModelo>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Modelo', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<InspecaoSegurancaModelo>('nome', 'modelo') },
      { title: 'Tipo', key: 'tipo', render: (_, row: ModeloRow) => row.tipo?.nome ?? '-', width: 200 },
      { title: 'Contexto', key: 'contexto', render: (_, row: ModeloRow) => row.tipo?.contexto ?? '-', width: 140 },
      { title: 'Grupos', key: 'grupos', render: (_, row: ModeloRow) => row.gruposRelacao?.length ?? 0, width: 120 },
    ],
    {
      onEdit: async item => {
        const res = await getInspecaoSegurancaModelo({ id: item.id });
        controller.open((res.data || item) as InspecaoSegurancaModelo);
      },
      onDelete: item => controller.exec(() => deleteInspecaoSegurancaModelo({ id: item.id }), 'Modelo excluído com sucesso!').finally(() => modelos.mutate()),
    }
  );
  return <CrudPage<InspecaoSegurancaModelo, InspecaoSegurancaModeloFormData> title='Modelos de Inspeção' entityKey='inspecao-seguranca-modelos' controller={controller} entityData={modelos} columns={columns} formComponent={InspecaoSegurancaModeloForm} onSubmit={handleSubmit} modalWidth={1000} />;
}
