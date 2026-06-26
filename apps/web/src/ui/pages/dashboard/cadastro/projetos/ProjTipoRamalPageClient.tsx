'use client';

import { createProjTipoRamal } from '@/lib/actions/projTipoRamal/create';
import { deleteProjTipoRamal } from '@/lib/actions/projTipoRamal/delete';
import { listProjTiposRamal } from '@/lib/actions/projTipoRamal/list';
import { updateProjTipoRamal } from '@/lib/actions/projTipoRamal/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { ProjTipoRamal } from '@nexa-oper/db';
import CatalogoProjetoNomeForm from './CatalogoProjetoNomeForm';

interface Props {
  initialData?: PaginatedResult<ProjTipoRamal>;
}

export default function ProjTipoRamalPageClient({ initialData }: Props) {
  const controller = useCrudController<ProjTipoRamal>('proj-tipos-ramal');

  const tiposRamal = useEntityData<ProjTipoRamal>({
    key: 'proj-tipos-ramal',
    fetcherAction: unwrapFetcher(listProjTiposRamal),
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
    createAction: createProjTipoRamal,
    updateAction: updateProjTipoRamal,
    onSuccess: () => tiposRamal.mutate(),
    successMessage: 'Tipo de ramal salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjTipoRamal>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ProjTipoRamal>('nome', 'nome do tipo de ramal'),
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
            () => deleteProjTipoRamal({ id: item.id }),
            'Tipo de ramal excluído com sucesso!'
          )
          .finally(() => tiposRamal.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Ramal'
      entityKey='proj-tipos-ramal'
      controller={controller}
      entityData={tiposRamal}
      columns={columns}
      formComponent={(props) => (
        <CatalogoProjetoNomeForm
          {...props}
          label='Nome do Tipo de Ramal'
          placeholder='Digite o nome do tipo de ramal (ex: MONO, BI, TRI)'
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
