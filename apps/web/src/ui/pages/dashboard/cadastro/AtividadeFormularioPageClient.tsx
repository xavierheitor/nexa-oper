'use client';

import { createAtividadeFormTemplate } from '@/lib/actions/atividadeFormTemplate/create';
import { deleteAtividadeFormTemplate } from '@/lib/actions/atividadeFormTemplate/delete';
import { listAtividadeFormTemplates } from '@/lib/actions/atividadeFormTemplate/list';
import { updateAtividadeFormTemplate } from '@/lib/actions/atividadeFormTemplate/update';
import { listAtividadeFormPerguntas } from '@/lib/actions/atividadeFormPergunta/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { PaginatedResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import AtividadeFormularioForm from '@/ui/pages/dashboard/cadastro/formulario-atividade/form';
import {
  AtividadeFormPergunta,
  AtividadeFormTemplate,
  AtividadeFormTipoServicoRelacao,
  Contrato,
  TipoAtividade,
  TipoAtividadeServico,
} from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag } from 'antd';

type TipoServicoRow = TipoAtividadeServico & {
  atividadeTipo?: Pick<TipoAtividade, 'id' | 'nome' | 'contratoId'> | null;
};

type AtividadeFormTemplateRow = AtividadeFormTemplate & {
  contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
  atividadeFormPerguntas?: Array<Pick<AtividadeFormPergunta, 'id' | 'perguntaChave'>>;
  atividadeFormTipoServicoRelacoes?: Array<
    AtividadeFormTipoServicoRelacao & {
      atividadeTipoServico?: TipoServicoRow | null;
    }
  >;
};

type PerguntaCatalogoRow = AtividadeFormPergunta & {
  atividadeFormTemplate?: Pick<AtividadeFormTemplate, 'id' | 'contratoId'> | null;
};

interface AtividadeFormularioPageClientProps {
  initialTemplates?: PaginatedResult<AtividadeFormTemplateRow>;
  initialContratos?: Contrato[];
  initialTiposServico?: TipoServicoRow[];
  initialPerguntasCatalogo?: PerguntaCatalogoRow[];
}

export default function AtividadeFormularioPageClient({
  initialTemplates,
  initialContratos = [],
  initialTiposServico = [],
  initialPerguntasCatalogo = [],
}: AtividadeFormularioPageClientProps) {
  const controller = useCrudController<AtividadeFormTemplateRow>('atividade-formularios');

  const templates = useEntityData<AtividadeFormTemplateRow>({
    key: 'atividade-formularios',
    fetcherAction: unwrapPaginatedFetcher(listAtividadeFormTemplates),
    paginationEnabled: true,
    initialData: initialTemplates,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
        atividadeFormPerguntas: {
          where: { deletedAt: null },
          select: { id: true, perguntaChave: true },
        },
        atividadeFormTipoServicoRelacoes: {
          where: { deletedAt: null },
          include: {
            atividadeTipoServico: {
              include: { atividadeTipo: true },
            },
          },
        },
      },
    },
  });

  const contratos = useEntityData<Contrato>({
    key: 'contratos-atividade-formulario',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const tiposServico = useEntityData<TipoServicoRow>({
    key: 'tipos-servico-atividade-formulario',
    fetcherAction: unwrapFetcher(listTiposAtividadeServico),
    paginationEnabled: false,
    initialData: initialTiposServico,
    initialParams: {
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      include: {
        atividadeTipo: true,
      },
    },
  });

  const perguntasCatalogo = useEntityData<PerguntaCatalogoRow>({
    key: 'atividade-perguntas-catalogo',
    fetcherAction: unwrapFetcher(listAtividadeFormPerguntas),
    paginationEnabled: false,
    initialData: initialPerguntasCatalogo,
    initialParams: {
      page: 1,
      pageSize: 2000,
      orderBy: 'titulo',
      orderDir: 'asc',
      include: {
        atividadeFormTemplate: {
          select: {
            id: true,
            contratoId: true,
          },
        },
      },
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createAtividadeFormTemplate,
    updateAction: updateAtividadeFormTemplate,
    onSuccess: () => templates.mutate(),
    successMessage: 'Formulário salvo com sucesso!',
  });

  const columns = useTableColumnsWithActions<AtividadeFormTemplateRow>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AtividadeFormTemplateRow>('nome', 'nome'),
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
        render: (_: string, record: AtividadeFormTemplateRow) => {
          if (!record.contrato) {
            return '-';
          }

          return record.contrato.numero
            ? `${record.contrato.nome} (${record.contrato.numero})`
            : record.contrato.nome;
        },
      },
      {
        title: 'Perguntas',
        key: 'perguntas',
        width: 110,
        render: (_: unknown, record: AtividadeFormTemplateRow) =>
          record.atividadeFormPerguntas?.length || 0,
      },
      {
        title: 'Tipos de Serviço',
        key: 'tiposServico',
        width: 140,
        render: (_: unknown, record: AtividadeFormTemplateRow) =>
          record.atividadeFormTipoServicoRelacoes?.length || 0,
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) =>
          ativo ? <Tag color='green'>Sim</Tag> : <Tag color='red'>Não</Tag>,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        width: 120,
        render: (date: Date | string) => new Date(date).toLocaleDateString('pt-BR'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAtividadeFormTemplate({ id: item.id }),
            'Formulário excluído com sucesso!'
          )
          .finally(() => templates.mutate()),
    }
  );

  if (templates.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar formulários de atividade.</p>;
  }

  return (
    <>
      <Card
        title='Formulários de Atividade'
        extra={
          <Button type='primary' onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        <Table<AtividadeFormTemplateRow>
          columns={columns}
          dataSource={templates.data}
          loading={templates.isLoading}
          rowKey='id'
          pagination={templates.pagination}
          onChange={templates.handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Formulário' : 'Novo Formulário'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={980}
      >
        <AtividadeFormularioForm
          initialValues={
            controller.editingItem
              ? (() => {
                  const perguntaChaves = new Set(
                    controller.editingItem.atividadeFormPerguntas?.map(
                      (item) => item.perguntaChave
                    ) || []
                  );

                  const perguntaIds = (perguntasCatalogo.data || [])
                    .filter(
                      (pergunta) =>
                        pergunta.atividadeFormTemplate?.contratoId ===
                          controller.editingItem?.contratoId &&
                        perguntaChaves.has(pergunta.perguntaChave)
                    )
                    .map((pergunta) => pergunta.id);

                  return {
                    nome: controller.editingItem.nome,
                    descricao: controller.editingItem.descricao ?? undefined,
                    contratoId: controller.editingItem.contratoId,
                    ativo: controller.editingItem.ativo,
                    perguntaIds,
                    atividadeFormTipoServicoRelacoes:
                      controller.editingItem.atividadeFormTipoServicoRelacoes?.map(
                        (item) => ({
                          atividadeTipoServicoId: item.atividadeTipoServicoId,
                        })
                      ),
                  };
                })()
              : undefined
          }
          contratos={contratos.data || []}
          tiposServico={tiposServico.data || []}
          perguntasCatalogo={perguntasCatalogo.data || []}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
