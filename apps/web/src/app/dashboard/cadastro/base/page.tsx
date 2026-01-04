'use client';

// Importações das Server Actions específicas da base
import { createBase } from '@/lib/actions/base/create';
import { deleteBase } from '@/lib/actions/base/delete';
import { listBases } from '@/lib/actions/base/list';
import { updateBase } from '@/lib/actions/base/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import CrudPage from '@/lib/components/CrudPage';

// Importações de tipos e utilitários
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma
import { Base } from '@nexa-oper/db';
import BaseForm, { BaseFormData } from './form';

export default function BasePage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  const controller = useCrudController<Base>('bases');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const bases = useEntityData<Base>({
    key: 'bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { contrato: true },
    },
  });

  // Handler padronizado para forms CRUD
  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createBase,
    updateAction: updateBase,
    onSuccess: () => bases.mutate(),
    successMessage: 'Base salva com sucesso!',
  });

  // Configuração das colunas da tabela com ações integradas
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
          .exec(() => deleteBase({ id: item.id }), 'Base excluída com sucesso!')
          .finally(() => bases.mutate()),
    }
  );

  return (
    <CrudPage
      title="Bases"
      entityKey="bases"
      controller={controller}
      entityData={bases}
      columns={columns}
      formComponent={BaseForm}
      onSubmit={handleSubmit}
    />
  );
}
