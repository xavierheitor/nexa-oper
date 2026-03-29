'use client';

import { Tag } from 'antd';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listProjProgramas } from '@/lib/actions/projPrograma/list';
import { createProjProjeto } from '@/lib/actions/projProjeto/create';
import { deleteProjProjeto } from '@/lib/actions/projProjeto/delete';
import { listProjProjetos } from '@/lib/actions/projProjeto/list';
import { updateProjProjeto } from '@/lib/actions/projProjeto/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getSelectFilter, getTextFilter } from '@/ui/components/tableFilters';
import type { ProjProgramaListItem } from '@/lib/repositories/projetos/ProjProgramaRepository';
import type { ProjProjetoListItem } from '@/lib/repositories/projetos/ProjProjetoRepository';
import ProjProjetoForm, {
  PROJECT_STATUS_OPTIONS,
  type ProjProjetoFormData,
} from './ProjProjetoForm';

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string | null;
}

interface Props {
  initialContratos?: ContratoOption[];
  initialProgramasLookup?: ProjProgramaListItem[];
  initialProjetos?: PaginatedResult<ProjProjetoListItem>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'gold',
  EM_VIABILIZACAO: 'processing',
  AGUARDANDO_VALIDACAO: 'geekblue',
  EM_CORRECAO: 'magenta',
  VIABILIZADO_PARCIAL: 'blue',
  VIABILIZADO_TOTAL: 'cyan',
  EM_PLANEJAMENTO: 'purple',
  EM_EXECUCAO: 'orange',
  FINALIZADO: 'green',
  CANCELADO: 'red',
};

const STATUS_LABELS = Object.fromEntries(
  PROJECT_STATUS_OPTIONS.map((option) => [option.value, option.label])
) as Record<string, string>;

export default function ProjetoCadastroPageClient({
  initialContratos = [],
  initialProgramasLookup = [],
  initialProjetos,
}: Props) {
  const projetoController = useCrudController<ProjProjetoListItem>('proj-projetos');

  const contratos = useEntityData<ContratoOption>({
    key: 'proj-contratos-lookup',
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

  const programasLookup = useEntityData<ProjProgramaListItem>({
    key: 'proj-programas-lookup',
    fetcherAction: unwrapFetcher(listProjProgramas),
    paginationEnabled: false,
    initialData: initialProgramasLookup,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const projetos = useEntityData<ProjProjetoListItem>({
    key: 'proj-projetos',
    fetcherAction: unwrapFetcher(listProjProjetos),
    paginationEnabled: true,
    initialData: initialProjetos,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  const handleProjetoSubmit = useCrudFormHandler<
    ProjProjetoFormData,
    ProjProjetoListItem
  >({
    controller: projetoController,
    createAction: createProjProjeto,
    updateAction: updateProjProjeto,
    onSuccess: () => projetos.mutate(),
    successMessage: 'Projeto salvo com sucesso!',
  });

  const projetoColumns = useTableColumnsWithActions<ProjProjetoListItem>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Número do Projeto',
        dataIndex: 'numeroProjeto',
        key: 'numeroProjeto',
        sorter: true,
        ...getTextFilter<ProjProjetoListItem>(
          'numeroProjeto',
          'número do projeto'
        ),
      },
      {
        title: 'Programa',
        dataIndex: ['programa', 'nome'],
        key: 'programa',
        render: (_value: unknown, record) => record.programa.nome,
      },
      {
        title: 'Contrato',
        dataIndex: ['programa', 'contrato', 'nome'],
        key: 'contrato',
        render: (_value: unknown, record) =>
          record.programa.contrato.numero
            ? `${record.programa.contrato.nome} (${record.programa.contrato.numero})`
            : record.programa.contrato.nome,
      },
      {
        title: 'Município',
        dataIndex: 'municipio',
        key: 'municipio',
        sorter: true,
        ...getTextFilter<ProjProjetoListItem>('municipio', 'município'),
      },
      {
        title: 'Equipamento',
        dataIndex: 'equipamento',
        key: 'equipamento',
        sorter: true,
        ...getTextFilter<ProjProjetoListItem>('equipamento', 'equipamento'),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        sorter: true,
        ...getSelectFilter<ProjProjetoListItem>(
          'status',
          PROJECT_STATUS_OPTIONS.map((option) => ({
            text: option.label,
            value: option.value,
          }))
        ),
        render: (status: ProjProjetoListItem['status']) => (
          <Tag color={STATUS_COLORS[status] ?? 'default'}>
            {STATUS_LABELS[status] ?? status}
          </Tag>
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
      onEdit: projetoController.open,
      onDelete: (item) =>
        projetoController
          .exec(
            () => deleteProjProjeto({ id: item.id }),
            'Projeto excluído com sucesso!'
          )
          .finally(() => projetos.mutate()),
    }
  );

  const contratoOptions =
    contratos.data?.map((contrato) => ({
      label: contrato.numero
        ? `${contrato.nome} (${contrato.numero})`
        : contrato.nome,
      value: contrato.id,
    })) ?? [];

  const programaOptions =
    programasLookup.data?.map((programa) => ({
      label: programa.contrato.numero
        ? `${programa.nome} (${programa.contrato.numero})`
        : programa.nome,
      value: programa.id,
    })) ?? [];

  return (
    <CrudPage
      title='Projetos'
      entityKey='proj-projetos'
      controller={projetoController}
      entityData={projetos}
      columns={projetoColumns}
      formComponent={(props) => (
        <ProjProjetoForm
          {...props}
          programas={programasLookup.data ?? []}
        />
      )}
      onSubmit={handleProjetoSubmit}
      modalWidth={720}
      addButtonText='Novo Projeto'
      tableHeaderContent={
        <TableExternalFilters
          filters={[
            {
              label: 'Contrato',
              placeholder: 'Filtrar por contrato',
              options: contratoOptions,
              onChange: (contratoId) =>
                projetos.setParams((prev) => ({
                  ...prev,
                  contratoId: contratoId ? Number(contratoId) : undefined,
                  page: 1,
                })),
              loading: contratos.isLoading,
            },
            {
              label: 'Programa',
              placeholder: 'Filtrar por programa',
              options: programaOptions,
              onChange: (programaId) =>
                projetos.setParams((prev) => ({
                  ...prev,
                  programaId: programaId ? Number(programaId) : undefined,
                  page: 1,
                })),
              loading: programasLookup.isLoading,
            },
          ]}
        />
      }
    />
  );
}
