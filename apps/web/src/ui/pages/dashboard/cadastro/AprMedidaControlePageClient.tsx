'use client';

import { createAprMedidaControle } from '@/lib/actions/aprMedidaControle/create';
import { deleteAprMedidaControle } from '@/lib/actions/aprMedidaControle/delete';
import { listAprMedidasControle } from '@/lib/actions/aprMedidaControle/list';
import { updateAprMedidaControle } from '@/lib/actions/aprMedidaControle/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprMedidaControle } from '@nexa-oper/db';
import AprMedidaControleForm from '@/ui/pages/dashboard/cadastro/apr-medida-controle/form';

interface AprMedidaControlePageClientProps {
  initialData?: PaginatedResult<AprMedidaControle>;
}

export default function AprMedidaControlePageClient({
  initialData,
}: AprMedidaControlePageClientProps) {
  const controller = useCrudController<AprMedidaControle>('apr-medidas-controle');

  const medidas = useEntityData<AprMedidaControle>({
    key: 'apr-medidas-controle',
    fetcherAction: unwrapFetcher(listAprMedidasControle),
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
    createAction: createAprMedidaControle,
    updateAction: updateAprMedidaControle,
    onSuccess: () => medidas.mutate(),
    successMessage: 'Medida de controle salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<AprMedidaControle>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprMedidaControle>('nome', 'nome da medida'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAprMedidaControle({ id: item.id }),
            'Medida de controle excluída com sucesso!'
          )
          .finally(() => medidas.mutate()),
    }
  );

  return (
    <CrudPage
      title='Medidas de Controle APR'
      entityKey='apr-medidas-controle'
      controller={controller}
      entityData={medidas}
      columns={columns}
      formComponent={AprMedidaControleForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}
