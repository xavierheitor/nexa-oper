'use client';

import { getChecklistPendencia } from '@/lib/actions/checklistPendencia/get';
import { listChecklistPendencias } from '@/lib/actions/checklistPendencia/list';
import { updateChecklistPendencia } from '@/lib/actions/checklistPendencia/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { ChecklistPendencia, StatusPendencia } from '@nexa-oper/db';
import { App, Button, Card, Modal, Spin, Table, Tag, Image, Space, Typography } from 'antd';
import ChecklistPendenciaForm from './form';

const { Text } = Typography;

export default function ChecklistPendenciasPage() {
  const { message } = App.useApp();
  const controller = useCrudController<ChecklistPendencia>('checklist-pendencias');

  const pendencias = useEntityData<ChecklistPendencia>({
    key: 'checklist-pendencias',
    fetcherAction: unwrapFetcher(listChecklistPendencias),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'createdAt',
      orderDir: 'desc',
    },
  });

  const getStatusColor = (status: StatusPendencia) => {
    switch (status) {
      case 'AGUARDANDO_TRATAMENTO':
        return 'red';
      case 'EM_TRATAMENTO':
        return 'orange';
      case 'TRATADA':
        return 'green';
      case 'REGISTRO_INCORRETO':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: StatusPendencia) => {
    switch (status) {
      case 'AGUARDANDO_TRATAMENTO':
        return 'Aguardando Tratamento';
      case 'EM_TRATAMENTO':
        return 'Em Tratamento';
      case 'TRATADA':
        return 'Tratada';
      case 'REGISTRO_INCORRETO':
        return 'Registro Incorreto';
      default:
        return status;
    }
  };

  const columns = useTableColumnsWithActions<ChecklistPendencia>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: StatusPendencia) => (
          <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
        ),
        filters: [
          { text: 'Aguardando Tratamento', value: 'AGUARDANDO_TRATAMENTO' },
          { text: 'Em Tratamento', value: 'EM_TRATAMENTO' },
          { text: 'Tratada', value: 'TRATADA' },
          { text: 'Registro Incorreto', value: 'REGISTRO_INCORRETO' },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: 'Checklist',
        key: 'checklist',
        render: (_, record: ChecklistPendencia & { checklistPreenchido?: { checklist?: { nome?: string } } }) =>
          record.checklistPreenchido?.checklist?.nome || 'N/A',
        width: 200,
      },
      {
        title: 'Eletricista',
        key: 'eletricista',
        render: (_, record: ChecklistPendencia & { checklistPreenchido?: { eletricista?: { nome?: string } } }) =>
          record.checklistPreenchido?.eletricista?.nome || 'N/A',
        width: 200,
      },
      {
        title: 'Equipe',
        key: 'equipe',
        render: (_, record: ChecklistPendencia & { turno?: { equipe?: { nome?: string } } }) =>
          record.turno?.equipe?.nome || 'N/A',
        width: 150,
      },
      {
        title: 'Pergunta',
        key: 'pergunta',
        render: (_, record: ChecklistPendencia & { checklistResposta?: { pergunta?: { nome?: string } } }) =>
          record.checklistResposta?.pergunta?.nome || 'N/A',
        width: 250,
      },
      {
        title: 'Resposta',
        key: 'resposta',
        render: (_, record: ChecklistPendencia & { checklistResposta?: { opcaoResposta?: { nome?: string } } }) =>
          record.checklistResposta?.opcaoResposta?.nome || 'N/A',
        width: 150,
      },
      {
        title: 'Observação Problema',
        dataIndex: 'observacaoProblema',
        key: 'observacaoProblema',
        ellipsis: true,
        ...getTextFilter<ChecklistPendencia>('observacaoProblema', 'observação'),
        width: 200,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'),
        width: 120,
      },
      {
        title: 'Fotos',
        key: 'fotos',
        width: 100,
        render: (_, record: ChecklistPendencia & { ChecklistRespostaFoto?: Array<{ urlPublica?: string; caminhoArquivo?: string }> }) => {
          const fotos = record.ChecklistRespostaFoto || [];
          if (fotos.length === 0) return <Text type="secondary">Sem fotos</Text>;

          return (
            <Space>
              {fotos.slice(0, 2).map((foto, idx) => (
                <Image
                  key={idx}
                  width={40}
                  height={40}
                  src={foto.urlPublica || foto.caminhoArquivo || ''}
                  alt={`Foto ${idx + 1}`}
                  preview={fotos.length > 1}
                />
              ))}
              {fotos.length > 2 && (
                <Text type="secondary">+{fotos.length - 2}</Text>
              )}
            </Space>
          );
        },
      },
    ],
    {
      onEdit: async (item) => {
        const res = await getChecklistPendencia({ id: item.id });
        if (res.data) {
          controller.open(res.data);
        }
      },
      // Não permite deletar, apenas tratar
    }
  );

  const handleSubmit = async (values: {
    id: number;
    status: StatusPendencia;
    observacaoTratamento?: string;
  }) => {
    const action = async (): Promise<ActionResult<ChecklistPendencia>> => {
      const result = await updateChecklistPendencia(values);
      return result;
    };
    controller.exec(action, 'Pendência atualizada com sucesso!').finally(() => pendencias.mutate());
  };

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (pendencias.error) return <p style={{ color: 'red' }}>Erro ao carregar pendências.</p>;

  return (
    <>
      <Card
        title="Tratamento de Pendências"
        extra={
          <Button type="primary" onClick={() => pendencias.mutate()}>
            Atualizar
          </Button>
        }
      >
        <Table<ChecklistPendencia>
          columns={columns}
          dataSource={pendencias.data}
          loading={pendencias.isLoading}
          rowKey="id"
          pagination={pendencias.pagination}
          onChange={pendencias.handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title="Tratar Pendência"
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={800}
      >
        {controller.editingItem && (
          <ChecklistPendenciaForm
            initialValues={controller.editingItem}
            onSubmit={handleSubmit}
            loading={controller.loading}
          />
        )}
      </Modal>
    </>
  );
}
