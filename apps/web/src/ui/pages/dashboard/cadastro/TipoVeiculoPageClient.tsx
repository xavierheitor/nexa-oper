'use client';

import { createTipoVeiculo } from '@/lib/actions/tipoVeiculo/create';
import { deleteTipoVeiculo } from '@/lib/actions/tipoVeiculo/delete';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import { updateTipoVeiculo } from '@/lib/actions/tipoVeiculo/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoVeiculo } from '@nexa-oper/db';
import TipoVeiculoForm from '@/app/dashboard/cadastro/tipo-veiculo/form';

interface TipoVeiculoPageClientProps {
  initialData?: PaginatedResult<TipoVeiculo>;
}

export default function TipoVeiculoPageClient({
  initialData,
}: TipoVeiculoPageClientProps) {
  const controller = useCrudController<TipoVeiculo>('tipos-veiculo');

  const tiposVeiculo = useEntityData<TipoVeiculo>({
    key: 'tipos-veiculo',
    fetcherAction: unwrapFetcher(listTiposVeiculo),
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
    createAction: createTipoVeiculo,
    updateAction: updateTipoVeiculo,
    onSuccess: () => tiposVeiculo.mutate(),
    successMessage: 'Tipo de veiculo salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<TipoVeiculo>(
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
        ...getTextFilter<TipoVeiculo>('nome', 'nome do tipo de veiculo'),
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
            () => deleteTipoVeiculo({ id: item.id }),
            'Tipo de veiculo excluido com sucesso!'
          )
          .finally(() => tiposVeiculo.mutate()),
    }
  );

  return (
    <CrudPage
      title='Tipos de Veiculo'
      entityKey='tipos-veiculo'
      controller={controller}
      entityData={tiposVeiculo}
      columns={columns}
      formComponent={TipoVeiculoForm}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
