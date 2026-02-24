'use client';

import { createBase } from '@/lib/actions/base/create';
import { deleteBase } from '@/lib/actions/base/delete';
import { listBases } from '@/lib/actions/base/list';
import { updateBase } from '@/lib/actions/base/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Base } from '@nexa-oper/db';
import { Spin } from 'antd';
import BaseForm from '@/app/dashboard/cadastro/base/form';

interface BasePageClientProps {
  initialData?: PaginatedResult<Base>;
}

export default function BasePageClient({ initialData }: BasePageClientProps) {
  const controller = useCrudController<Base>('bases');

  const bases = useEntityData<Base>({
    key: 'bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { contrato: true },
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createBase,
    updateAction: updateBase,
    onSuccess: () => bases.mutate(),
    successMessage: 'Base salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<Base>(
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
        ...getTextFilter<Base>('nome', 'nome'),
      },
      {
        title: 'Contrato ID',
        dataIndex: 'contratoId',
        key: 'contratoId',
        sorter: true,
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(() => deleteBase({ id: item.id }), 'Base excluida com sucesso!')
          .finally(() => bases.mutate()),
    }
  );

  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  return (
    <CrudPage
      title='Bases'
      entityKey='bases'
      controller={controller}
      entityData={bases}
      columns={columns}
      formComponent={BaseForm}
      onSubmit={handleSubmit}
    />
  );
}
