'use client';

import { createCargo } from '@/lib/actions/cargo/create';
import { deleteCargo } from '@/lib/actions/cargo/delete';
import { listCargos } from '@/lib/actions/cargo/list';
import { updateCargo } from '@/lib/actions/cargo/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Cargo } from '@nexa-oper/db';
import { Tag } from 'antd';
import CargoForm from '@/ui/pages/dashboard/cadastro/cargo/form';

interface CargoPageClientProps {
  initialData?: PaginatedResult<Cargo>;
}

export default function CargoPageClient({ initialData }: CargoPageClientProps) {
  const controller = useCrudController<Cargo>('cargos');

  const cargos = useEntityData<Cargo>({
    key: 'cargos',
    fetcherAction: unwrapFetcher(listCargos),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createCargo,
    updateAction: updateCargo,
    onSuccess: () => cargos.mutate(),
    successMessage: 'Cargo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<Cargo>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Cargo>('nome', 'nome do cargo'),
      },
      {
        title: 'Salario Base',
        dataIndex: 'salarioBase',
        key: 'salarioBase',
        sorter: true,
        render: (valor: number) =>
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(valor),
        width: 150,
      },
      {
        title: 'Eletricistas',
        key: 'eletricistas',
        width: 120,
        render: (_: unknown, record: Cargo & { _count?: { Eletricista?: number } }) => (
          <Tag color='blue'>{record._count?.Eletricista || 0}</Tag>
        ),
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
          .exec(() => deleteCargo({ id: item.id }), 'Cargo excluido com sucesso!')
          .finally(() => {
            cargos.mutate();
          }),
    }
  );

  return (
    <CrudPage
      title='Cargos'
      entityKey='cargos'
      controller={controller}
      entityData={cargos}
      columns={columns}
      formComponent={CargoForm}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
