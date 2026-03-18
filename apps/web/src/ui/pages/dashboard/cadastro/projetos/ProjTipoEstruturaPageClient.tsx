'use client';

import { createProjTipoEstrutura } from '@/lib/actions/projTipoEstrutura/create';
import { deleteProjTipoEstrutura } from '@/lib/actions/projTipoEstrutura/delete';
import { listProjTiposEstrutura } from '@/lib/actions/projTipoEstrutura/list';
import { updateProjTipoEstrutura } from '@/lib/actions/projTipoEstrutura/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import type { ProjTipoEstrutura } from '@nexa-oper/db';
import CatalogoProjetoNomeForm from './CatalogoProjetoNomeForm';

interface ProjTipoEstruturaPageClientProps {
  initialData?: PaginatedResult<ProjTipoEstrutura>;
}

export default function ProjTipoEstruturaPageClient({
  initialData,
}: ProjTipoEstruturaPageClientProps) {
  const controller = useCrudController<ProjTipoEstrutura>(
    'proj-tipos-estrutura'
  );

  const tiposEstrutura = useEntityData<ProjTipoEstrutura>({
    key: 'proj-tipos-estrutura',
    fetcherAction: unwrapFetcher(listProjTiposEstrutura),
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
    createAction: createProjTipoEstrutura,
    updateAction: updateProjTipoEstrutura,
    onSuccess: () => tiposEstrutura.mutate(),
    successMessage: 'Tipo de estrutura salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjTipoEstrutura>(
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
        ...getTextFilter<ProjTipoEstrutura>('nome', 'nome do tipo de estrutura'),
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
            () => deleteProjTipoEstrutura({ id: item.id }),
            'Tipo de estrutura excluído com sucesso!'
          )
          .finally(() => tiposEstrutura.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Estrutura'
      entityKey='proj-tipos-estrutura'
      controller={controller}
      entityData={tiposEstrutura}
      columns={columns}
      formComponent={(props) => (
        <CatalogoProjetoNomeForm
          {...props}
          label='Nome do Tipo de Estrutura'
          placeholder='Digite o nome do tipo de estrutura (ex: N4, N1+S1)'
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
