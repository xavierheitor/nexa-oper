'use client';

// Importações das Server Actions específicas do tipo de veículo
import { createTipoVeiculo } from '@/lib/actions/tipoVeiculo/create';
import { deleteTipoVeiculo } from '@/lib/actions/tipoVeiculo/delete';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import { updateTipoVeiculo } from '@/lib/actions/tipoVeiculo/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import CrudPage from '@/lib/components/CrudPage';

// Importações de tipos e utilitários
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma
import { TipoVeiculo } from '@nexa-oper/db';
import TipoVeiculoForm, { TipoVeiculoFormData } from './form';

export default function TipoVeiculoPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  const controller = useCrudController<TipoVeiculo>('tipos-veiculo');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const tiposVeiculo = useEntityData<TipoVeiculo>({
    key: 'tipos-veiculo',
    fetcherAction: unwrapFetcher(listTiposVeiculo),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  // Handler padronizado para forms CRUD
  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createTipoVeiculo,
    updateAction: updateTipoVeiculo,
    onSuccess: () => tiposVeiculo.mutate(),
    successMessage: 'Tipo de veículo salvo com sucesso!',
  });

  // Configuração das colunas da tabela com ações integradas
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
        ...getTextFilter<TipoVeiculo>('nome', 'nome do tipo de veículo'),
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
          .exec(() => deleteTipoVeiculo({ id: item.id }), 'Tipo de veículo excluído com sucesso!')
          .finally(() => tiposVeiculo.mutate()),
    }
  );

  return (
    <CrudPage
      title="Tipos de Veículo"
      entityKey="tipos-veiculo"
      controller={controller}
      entityData={tiposVeiculo}
      columns={columns}
      formComponent={TipoVeiculoForm}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
