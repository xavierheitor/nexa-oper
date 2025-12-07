'use client';

import { Card, Table, Button, Modal, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createTipoJustificativa } from '@/lib/actions/tipo-justificativa/create';
import { updateTipoJustificativa } from '@/lib/actions/tipo-justificativa/update';
import { deleteTipoJustificativa } from '@/lib/actions/tipo-justificativa/delete';
import { listTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { TipoJustificativa } from '@nexa-oper/db';
import TipoJustificativaForm, { TipoJustificativaFormData } from './form';

/**
 * Página CRUD de tipos de justificativa
 */
export default function TipoJustificativaPage() {
  const controller = useCrudController<TipoJustificativa>('tipos-justificativa');

  const tipos = useEntityData<TipoJustificativa>({
    key: 'tipos-justificativa',
    fetcherAction: unwrapFetcher(listTiposJustificativa),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const columns = useTableColumnsWithActions<TipoJustificativa>(
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
        ...getTextFilter<TipoJustificativa>('nome', 'nome do tipo'),
      },
      {
        title: 'Descrição',
        dataIndex: 'descricao',
        key: 'descricao',
        render: (descricao: string | null) => descricao || '-',
      },
      {
        title: 'Gera Falta',
        dataIndex: 'geraFalta',
        key: 'geraFalta',
        render: (geraFalta: boolean) => (
          <Tag color={geraFalta ? 'red' : 'green'}>
            {geraFalta ? 'Sim' : 'Não'}
          </Tag>
        ),
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'success' : 'default'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date | string) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteTipoJustificativa({ id: item.id }),
            'Tipo de justificativa excluído com sucesso!'
          )
          .finally(() => {
            tipos.mutate();
          }),
    }
  );

  const handleSubmit = async (values: TipoJustificativaFormData) => {
    const action = async () => {
      const result = controller.editingItem?.id
        ? await updateTipoJustificativa({
          ...values,
          id: controller.editingItem.id,
        })
        : await createTipoJustificativa(values);
      return result;
    };

    controller.exec(action, 'Tipo de justificativa salvo com sucesso!').finally(() => {
      tipos.mutate();
    });
  };

  if (tipos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar tipos de justificativa.</p>;
  }

  return (
    <>
      <Card
        title="Tipos de Justificativa"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => controller.open()}>
            Novo Tipo
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tipos.data}
          loading={tipos.isLoading}
          rowKey="id"
          pagination={tipos.pagination}
          onChange={tipos.handleTableChange}
        />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Tipo de Justificativa' : 'Novo Tipo de Justificativa'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <TipoJustificativaForm
          initialValues={
            controller.editingItem
              ? {
                nome: controller.editingItem.nome,
                descricao: controller.editingItem.descricao || undefined,
                ativo: controller.editingItem.ativo,
                geraFalta: controller.editingItem.geraFalta,
              }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}

