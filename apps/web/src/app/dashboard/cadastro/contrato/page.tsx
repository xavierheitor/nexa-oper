'use client';

// Importações das Server Actions específicas do contrato
import { createContrato } from '@/lib/actions/contrato/create';
import { deleteContrato } from '@/lib/actions/contrato/delete';
import { listContratos } from '@/lib/actions/contrato/list';
import { updateContrato } from '@/lib/actions/contrato/update';

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
import { Contrato } from '@nexa-oper/db';
import ContratoForm, { ContratoFormData } from './form';

export default function ContratoPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  const controller = useCrudController<Contrato>('contratos');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const contratos = useEntityData<Contrato>({
    key: 'contratos',
    fetcherAction: unwrapFetcher(listContratos),
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
    createAction: createContrato,
    updateAction: updateContrato,
    onSuccess: () => contratos.mutate(),
    successMessage: 'Contrato salvo com sucesso!',
  });

  // Configuração das colunas da tabela com ações integradas
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
          .exec(() => deleteContrato({ id: item.id }), 'Contrato excluído com sucesso!')
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
