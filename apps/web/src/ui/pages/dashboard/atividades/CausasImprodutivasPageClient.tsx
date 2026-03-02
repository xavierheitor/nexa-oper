'use client';

import { Tag } from 'antd';
import { createCausaImprodutiva } from '@/lib/actions/causaImprodutiva/create';
import { deleteCausaImprodutiva } from '@/lib/actions/causaImprodutiva/delete';
import { listCausasImprodutivas } from '@/lib/actions/causaImprodutiva/list';
import { updateCausaImprodutiva } from '@/lib/actions/causaImprodutiva/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import CausaImprodutivaForm from '@/ui/pages/dashboard/atividades/causas-improdutivas/form';
import { CausaImprodutiva } from '@nexa-oper/db';

interface CausasImprodutivasPageClientProps {
  initialData?: PaginatedResult<CausaImprodutiva>;
}

export default function CausasImprodutivasPageClient({
  initialData,
}: CausasImprodutivasPageClientProps) {
  const controller = useCrudController<CausaImprodutiva>('causas-improdutivas');

  const causas = useEntityData<CausaImprodutiva>({
    key: 'causas-improdutivas',
    fetcherAction: unwrapFetcher(listCausasImprodutivas),
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
    createAction: createCausaImprodutiva,
    updateAction: updateCausaImprodutiva,
    onSuccess: () => causas.mutate(),
    successMessage: 'Causa improdutiva salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<CausaImprodutiva>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Causa',
        dataIndex: 'causa',
        key: 'causa',
        sorter: true,
        ...getTextFilter<CausaImprodutiva>('causa', 'causa'),
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) =>
          ativo ? <Tag color='success'>Ativo</Tag> : <Tag>Inativo</Tag>,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        width: 120,
        render: (date: Date | string) =>
          new Date(date).toLocaleDateString('pt-BR'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteCausaImprodutiva({ id: item.id }),
            'Causa improdutiva excluída com sucesso!'
          )
          .finally(() => causas.mutate()),
    }
  );

  return (
    <CrudPage
      title='Causas Improdutivas'
      entityKey='causas-improdutivas'
      controller={controller}
      entityData={causas}
      columns={columns}
      formComponent={CausaImprodutivaForm}
      onSubmit={handleSubmit}
      addButtonText='Nova Causa'
    />
  );
}
