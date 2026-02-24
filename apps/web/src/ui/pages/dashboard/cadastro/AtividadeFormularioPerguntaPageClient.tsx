'use client';

import { createAtividadeFormPergunta } from '@/lib/actions/atividadeFormPergunta/create';
import { deleteAtividadeFormPergunta } from '@/lib/actions/atividadeFormPergunta/delete';
import { listAtividadeFormPerguntas } from '@/lib/actions/atividadeFormPergunta/list';
import { updateAtividadeFormPergunta } from '@/lib/actions/atividadeFormPergunta/update';
import { listContratos } from '@/lib/actions/contrato/list';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { PaginatedResult } from '@/lib/types/common';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import { getTextFilter } from '@/ui/components/tableFilters';
import AtividadeFormularioPerguntaForm from '@/ui/pages/dashboard/cadastro/formulario-atividade-pergunta/form';
import { AtividadeFormPergunta, AtividadeFormTemplate, Contrato } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag } from 'antd';

type AtividadeFormPerguntaRow = AtividadeFormPergunta & {
  atividadeFormTemplate?:
    | (Pick<AtividadeFormTemplate, 'id' | 'nome' | 'contratoId'> & {
        contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
      })
    | null;
};

interface AtividadeFormularioPerguntaPageClientProps {
  initialPerguntas?: PaginatedResult<AtividadeFormPerguntaRow>;
  initialContratos?: Contrato[];
}

export default function AtividadeFormularioPerguntaPageClient({
  initialPerguntas,
  initialContratos = [],
}: AtividadeFormularioPerguntaPageClientProps) {
  const controller = useCrudController<AtividadeFormPerguntaRow>('atividade-form-perguntas');

  const perguntas = useEntityData<AtividadeFormPerguntaRow>({
    key: 'atividade-form-perguntas',
    fetcherAction: unwrapPaginatedFetcher(listAtividadeFormPerguntas),
    paginationEnabled: true,
    initialData: initialPerguntas,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        atividadeFormTemplate: {
          include: {
            contrato: true,
          },
        },
      },
    },
  });

  const contratos = useEntityData<Contrato>({
    key: 'contratos-atividade-perguntas',
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

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createAtividadeFormPergunta,
    updateAction: updateAtividadeFormPergunta,
    onSuccess: () => perguntas.mutate(),
    successMessage: 'Pergunta salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<AtividadeFormPerguntaRow>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Pergunta',
        dataIndex: 'titulo',
        key: 'titulo',
        sorter: true,
        ...getTextFilter<AtividadeFormPerguntaRow>('titulo', 'pergunta'),
      },
      {
        title: 'Chave',
        dataIndex: 'perguntaChave',
        key: 'perguntaChave',
        sorter: true,
      },
      {
        title: 'Contrato',
        dataIndex: ['atividadeFormTemplate', 'contrato', 'nome'],
        key: 'contrato',
        render: (_: string, record: AtividadeFormPerguntaRow) => {
          const contrato = record.atividadeFormTemplate?.contrato;
          if (!contrato) {
            return '-';
          }

          return contrato.numero ? `${contrato.nome} (${contrato.numero})` : contrato.nome;
        },
      },
      {
        title: 'Tipo de Resposta',
        dataIndex: 'tipoResposta',
        key: 'tipoResposta',
        width: 150,
      },
      {
        title: 'Obrigar Foto',
        dataIndex: 'obrigaFoto',
        key: 'obrigaFoto',
        width: 120,
        render: (obrigaFoto: boolean) =>
          obrigaFoto ? <Tag color='gold'>Sim</Tag> : <Tag>Não</Tag>,
      },
      {
        title: 'Ordem',
        dataIndex: 'ordem',
        key: 'ordem',
        sorter: true,
        width: 90,
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 90,
        render: (ativo: boolean) =>
          ativo ? <Tag color='green'>Sim</Tag> : <Tag color='red'>Não</Tag>,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAtividadeFormPergunta({ id: item.id }),
            'Pergunta excluída com sucesso!'
          )
          .finally(() => perguntas.mutate()),
    }
  );

  if (perguntas.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar perguntas do catálogo.</p>;
  }

  return (
    <>
      <Card
        title='Perguntas de Atividade (Catálogo)'
        extra={
          <Button type='primary' onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
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
                })) || [],
              onChange: (contratoId) =>
                perguntas.setParams((prev) => ({
                  ...prev,
                  contratoId,
                  page: 1,
                })),
              loading: contratos.isLoading,
            },
          ]}
        />

        <Table<AtividadeFormPerguntaRow>
          columns={columns}
          dataSource={perguntas.data}
          loading={perguntas.isLoading}
          rowKey='id'
          pagination={perguntas.pagination}
          onChange={perguntas.handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Pergunta' : 'Nova Pergunta'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <AtividadeFormularioPerguntaForm
          initialValues={
            controller.editingItem
              ? {
                  contratoId:
                    controller.editingItem.atividadeFormTemplate?.contratoId,
                  perguntaChave: controller.editingItem.perguntaChave,
                  ordem: controller.editingItem.ordem,
                  titulo: controller.editingItem.titulo,
                  hintResposta: controller.editingItem.hintResposta || undefined,
                  tipoResposta: controller.editingItem.tipoResposta,
                  obrigaFoto: controller.editingItem.obrigaFoto,
                  ativo: controller.editingItem.ativo,
                }
              : undefined
          }
          contratos={contratos.data || []}
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
