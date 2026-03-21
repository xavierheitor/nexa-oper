'use client';

import { Tag } from 'antd';
import { Contrato, ProjetoProgramacao } from '@nexa-oper/db';
import { createProjetoProgramacao } from '@/lib/actions/projetoProgramacao/create';
import { deleteProjetoProgramacao } from '@/lib/actions/projetoProgramacao/delete';
import { listProjetoProgramacoes } from '@/lib/actions/projetoProgramacao/list';
import { updateProjetoProgramacao } from '@/lib/actions/projetoProgramacao/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import { getSelectFilter, getTextFilter } from '@/ui/components/tableFilters';
import ProjetoProgramacaoForm, {
  ProjetoProgramacaoFormData,
} from './ProjetoProgramacaoForm';

type ProjetoProgramacaoListItem = ProjetoProgramacao & {
  contrato: Contrato;
};

interface ContratoOption {
  id: number;
  nome: string;
  numero: string;
}

interface ProjetoProgramacaoPageClientProps {
  contratos: ContratoOption[];
  initialData?: PaginatedResult<ProjetoProgramacaoListItem>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Aguardando Viabilização',
  EM_VIABILIZACAO: 'Em Viabilização',
  VIABILIZADO_PARCIAL: 'Viabilizado Parcial',
  VIABILIZADO_TOTAL: 'Viabilizado Total',
  EM_PLANEJAMENTO: 'Em Planejamento',
  EM_EXECUCAO: 'Em Execução',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'gold',
  EM_VIABILIZACAO: 'processing',
  VIABILIZADO_PARCIAL: 'blue',
  VIABILIZADO_TOTAL: 'cyan',
  EM_PLANEJAMENTO: 'purple',
  EM_EXECUCAO: 'orange',
  FINALIZADO: 'green',
  CANCELADO: 'red',
};

export default function ProjetoProgramacaoPageClient({
  contratos,
  initialData,
}: ProjetoProgramacaoPageClientProps) {
  const controller =
    useCrudController<ProjetoProgramacaoListItem>('projeto-programacao');

  const projetos = useEntityData<ProjetoProgramacaoListItem>({
    key: 'projeto-programacao',
    fetcherAction: unwrapFetcher(listProjetoProgramacoes),
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
    ProjetoProgramacaoFormData,
    ProjetoProgramacaoListItem
  >({
    controller,
    createAction: createProjetoProgramacao,
    updateAction: updateProjetoProgramacao,
    onSuccess: () => projetos.mutate(),
    successMessage: 'Projeto salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<ProjetoProgramacaoListItem>(
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
        ...getTextFilter<ProjetoProgramacaoListItem>(
          'numeroProjeto',
          'número do projeto'
        ),
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        sorter: true,
        render: (_value: unknown, record) =>
          `${record.contrato.nome} (${record.contrato.numero})`,
      },
      {
        title: 'Município',
        dataIndex: 'municipio',
        key: 'municipio',
        sorter: true,
        ...getTextFilter<ProjetoProgramacaoListItem>('municipio', 'município'),
      },
      {
        title: 'Equipamento',
        dataIndex: 'equipamento',
        key: 'equipamento',
        sorter: true,
        ...getTextFilter<ProjetoProgramacaoListItem>(
          'equipamento',
          'equipamento'
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        sorter: true,
        ...getSelectFilter<ProjetoProgramacaoListItem>('status', [
          { text: 'Aguardando Viabilização', value: 'PENDENTE' },
          { text: 'Em Viabilização', value: 'EM_VIABILIZACAO' },
          { text: 'Viabilizado Parcial', value: 'VIABILIZADO_PARCIAL' },
          { text: 'Viabilizado Total', value: 'VIABILIZADO_TOTAL' },
          { text: 'Em Planejamento', value: 'EM_PLANEJAMENTO' },
          { text: 'Em Execução', value: 'EM_EXECUCAO' },
          { text: 'Finalizado', value: 'FINALIZADO' },
          { text: 'Cancelado', value: 'CANCELADO' },
        ]),
        render: (status: ProjetoProgramacaoListItem['status']) => (
          <Tag color={STATUS_COLORS[status] || 'default'}>
            {STATUS_LABELS[status] || status}
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
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteProjetoProgramacao({ id: item.id }),
            'Projeto excluído com sucesso!'
          )
          .finally(() => projetos.mutate()),
    }
  );

  return (
    <CrudPage
      title="Projetos"
      entityKey="projeto-programacao"
      controller={controller}
      entityData={projetos}
      columns={columns}
      formComponent={(props) => (
        <ProjetoProgramacaoForm
          {...props}
          contratos={contratos}
        />
      )}
      onSubmit={handleSubmit}
      modalWidth={720}
      addButtonText="Novo Projeto"
    />
  );
}
