'use client';

import type { Contrato, ProjTipoEstrutura } from '@nexa-oper/db';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
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
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getTextFilter } from '@/ui/components/tableFilters';
import ProjTipoEstruturaForm, {
  type ProjTipoEstruturaFormData,
} from './ProjTipoEstruturaForm';
import ProjTipoEstruturaMaterialPageClient, {
  type ProjTipoEstruturaMaterialPageClientProps,
} from './ProjTipoEstruturaMaterialPageClient';

type ContratoOption = Pick<Contrato, 'id' | 'nome' | 'numero'>;

export type ProjTipoEstruturaTableRow = ProjTipoEstrutura & {
  contrato?: ContratoOption | null;
};

interface Props {
  initialData?: PaginatedResult<ProjTipoEstruturaTableRow>;
  initialContratos?: ContratoOption[];
  initialMaterialData?: ProjTipoEstruturaMaterialPageClientProps['initialData'];
  initialTiposEstruturaLookup?: ProjTipoEstruturaMaterialPageClientProps['initialTiposEstrutura'];
  initialMateriais?: ProjTipoEstruturaMaterialPageClientProps['initialMateriais'];
}

export default function ProjTipoEstruturaPageClient({
  initialData,
  initialContratos = [],
  initialMaterialData,
  initialTiposEstruturaLookup = [],
  initialMateriais = [],
}: Props) {
  const controller = useCrudController<ProjTipoEstruturaTableRow>(
    'proj-tipos-estrutura'
  );

  const contratos = useEntityData<ContratoOption>({
    key: 'proj-tipos-estrutura-contratos',
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

  const tiposEstrutura = useEntityData<ProjTipoEstruturaTableRow>({
    key: 'proj-tipos-estrutura',
    fetcherAction: unwrapFetcher(listProjTiposEstrutura),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
      },
    },
  });

  const handleSubmit = useCrudFormHandler<ProjTipoEstruturaFormData, ProjTipoEstruturaTableRow>({
    controller,
    createAction: createProjTipoEstrutura,
    updateAction: updateProjTipoEstrutura,
    onSuccess: () => tiposEstrutura.mutate(),
    successMessage: 'Tipo de estrutura salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjTipoEstruturaTableRow>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        sorter: true,
        render: (_: unknown, record) =>
          record.contrato
            ? record.contrato.numero
              ? `${record.contrato.nome} (${record.contrato.numero})`
              : record.contrato.nome
            : '-',
      },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<ProjTipoEstruturaTableRow>('nome', 'nome do tipo de estrutura'),
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
    <div style={{ display: 'grid', gap: 24 }}>
      <CrudPage
        title='Tipos de Estrutura'
        entityKey='proj-tipos-estrutura'
        controller={controller}
        entityData={tiposEstrutura}
        columns={columns}
        formComponent={(props) => (
          <ProjTipoEstruturaForm
            {...props}
            contratos={contratos.data ?? []}
          />
        )}
        onSubmit={handleSubmit}
        modalWidth={560}
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
                  tiposEstrutura.setParams((prev) => ({
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

      <ProjTipoEstruturaMaterialPageClient
        title='Materiais Padrão por Estrutura'
        initialData={initialMaterialData}
        initialTiposEstrutura={initialTiposEstruturaLookup}
        initialMateriais={initialMateriais}
      />
    </div>
  );
}
