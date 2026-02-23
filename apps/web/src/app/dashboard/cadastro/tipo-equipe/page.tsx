'use client';

// Importações das Server Actions específicas do tipo de equipe
import { createTipoEquipe } from '@/lib/actions/tipoEquipe/create';
import { deleteTipoEquipe } from '@/lib/actions/tipoEquipe/delete';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { updateTipoEquipe } from '@/lib/actions/tipoEquipe/update';

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
import { TipoEquipe } from '@nexa-oper/db';
import TipoEquipeForm, { TipoEquipeFormData } from './form';

export default function TipoEquipePage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  const controller = useCrudController<TipoEquipe>('tipos-equipe');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const tiposEquipe = useEntityData<TipoEquipe>({
    key: 'tipos-equipe',
    fetcherAction: unwrapFetcher(listTiposEquipe),
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
    createAction: createTipoEquipe,
    updateAction: updateTipoEquipe,
    onSuccess: () => tiposEquipe.mutate(),
    successMessage: 'Tipo de equipe salvo com sucesso!',
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<TipoEquipe>(
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
        ...getTextFilter<TipoEquipe>('nome', 'nome do tipo de equipe'),
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
          .exec(() => deleteTipoEquipe({ id: item.id }), 'Tipo de equipe excluído com sucesso!')
          .finally(() => tiposEquipe.mutate()),
    }
  );

  return (
    <CrudPage
      title="Tipos de Equipe"
      entityKey="tipos-equipe"
      controller={controller}
      entityData={tiposEquipe}
      columns={columns}
      formComponent={TipoEquipeForm}
      onSubmit={handleSubmit}
      modalWidth={500}
    />
  );
}
