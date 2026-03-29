'use client';

import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { createProjPrograma } from '@/lib/actions/projPrograma/create';
import { deleteProjPrograma } from '@/lib/actions/projPrograma/delete';
import { listProjProgramas } from '@/lib/actions/projPrograma/list';
import { updateProjPrograma } from '@/lib/actions/projPrograma/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { ProjProgramaListItem } from '@/lib/repositories/projetos/ProjProgramaRepository';
import type { PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getTextFilter } from '@/ui/components/tableFilters';
import ProjProgramaForm, {
  type ProjProgramaFormData,
} from '@/ui/pages/dashboard/projetos/ProjProgramaForm';

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string | null;
}

interface Props {
  initialContratos?: ContratoOption[];
  initialData?: PaginatedResult<ProjProgramaListItem>;
}

export default function ProjProgramaPageClient({
  initialContratos = [],
  initialData,
}: Props) {
  const controller = useCrudController<ProjProgramaListItem>('proj-programas-cadastro');

  const contratos = useEntityData<ContratoOption>({
    key: 'proj-programas-cadastro-contratos',
    fetcherAction: unwrapFetcher(listContratosLookup),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const programas = useEntityData<ProjProgramaListItem>({
    key: 'proj-programas-cadastro',
    fetcherAction: unwrapFetcher(listProjProgramas),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleSubmit = useCrudFormHandler<
    ProjProgramaFormData,
    ProjProgramaListItem
  >({
    controller,
    createAction: createProjPrograma,
    updateAction: updateProjPrograma,
    onSuccess: () => programas.mutate(),
    successMessage: 'Programa salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjProgramaListItem>(
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
        ...getTextFilter<ProjProgramaListItem>('nome', 'nome do programa'),
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        render: (_value: unknown, record) =>
          record.contrato.numero
            ? `${record.contrato.nome} (${record.contrato.numero})`
            : record.contrato.nome,
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
            () => deleteProjPrograma({ id: item.id }),
            'Programa excluído com sucesso!'
          )
          .finally(() => programas.mutate()),
    }
  );

  return (
    <CrudPage
      title='Programas'
      entityKey='proj-programas-cadastro'
      controller={controller}
      entityData={programas}
      columns={columns}
      formComponent={(props) => (
        <ProjProgramaForm
          {...props}
          contratos={contratos.data ?? []}
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={560}
      addButtonText='Novo Programa'
      tableHeaderContent={
        <TableExternalFilters
          filters={[
            {
              label: 'Contrato',
              placeholder: 'Filtrar por contrato',
              options:
                contratos.data?.map((contrato) => ({
                  label: contrato.numero
                    ? `${contrato.nome} (${contrato.numero})`
                    : contrato.nome,
                  value: contrato.id,
                })) ?? [],
              onChange: (contratoId) =>
                programas.setParams((prev) => ({
                  ...prev,
                  contratoId: contratoId ? Number(contratoId) : undefined,
                  page: 1,
                })),
              loading: contratos.isLoading,
            },
          ]}
        />
      }
    />
  );
}
