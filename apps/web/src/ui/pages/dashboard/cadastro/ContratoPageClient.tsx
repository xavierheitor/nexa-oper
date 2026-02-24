'use client';

import { createContrato } from '@/lib/actions/contrato/create';
import { deleteContrato } from '@/lib/actions/contrato/delete';
import { listContratos } from '@/lib/actions/contrato/list';
import { updateContrato } from '@/lib/actions/contrato/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Contrato } from '@nexa-oper/db';
import ContratoForm from '@/ui/pages/dashboard/cadastro/contrato/form';

interface ContratoPageClientProps {
  initialData?: PaginatedResult<Contrato>;
}

export default function ContratoPageClient({
  initialData,
}: ContratoPageClientProps) {
  const controller = useCrudController<Contrato>('contratos');

  const contratos = useEntityData<Contrato>({
    key: 'contratos',
    fetcherAction: unwrapPaginatedFetcher(listContratos),
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
    createAction: createContrato,
    updateAction: updateContrato,
    onSuccess: () => contratos.mutate(),
    successMessage: 'Contrato salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<Contrato>(
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
        ...getTextFilter<Contrato>('nome', 'nome do contrato'),
      },
      {
        title: 'Número',
        dataIndex: 'numero',
        key: 'numero',
        sorter: true,
        ...getTextFilter<Contrato>('numero', 'número do contrato'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteContrato({ id: item.id }),
            'Contrato excluído com sucesso!'
          )
          .finally(() => contratos.mutate()),
    }
  );

  return (
    <CrudPage
      title="Contratos"
      entityKey="contratos"
      controller={controller}
      entityData={contratos}
      columns={columns}
      formComponent={ContratoForm}
      onSubmit={handleSubmit}
    />
  );
}
