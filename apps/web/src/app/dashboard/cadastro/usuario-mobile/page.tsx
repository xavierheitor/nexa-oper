'use client';

import { createMobileUser } from '@/lib/actions/mobileUser/create';
import { deleteMobileUser } from '@/lib/actions/mobileUser/delete';
import { listMobileUsers } from '@/lib/actions/mobileUser/list';
import { resetMobileUserPassword } from '@/lib/actions/mobileUser/resetPassword';
import { updateMobileUser } from '@/lib/actions/mobileUser/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { MobileUser } from '@nexa-oper/db';
import { Button, Card, Modal, Space, Table, Tag } from 'antd';

import MobileUserForm, { MobileUserFormData } from './form';

export default function MobileUserPage() {
  // Hook para controle de operações CRUD
  const controller = useCrudController<MobileUser>('mobileUsers');

  // Hook para busca de dados com paginação
  const mobileUsers = useEntityData<MobileUser>({
    key: 'mobileUsers',
    fetcher: unwrapFetcher(listMobileUsers),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'username',
      orderDir: 'asc',
    },
  });

  // Configuração das colunas da tabela
  const columns = useTableColumnsWithActions<MobileUser>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        sorter: true,
        ...getTextFilter<MobileUser>('username', 'username do usuário móvel'),
        render: (username: string) => (
          <Space>
            <MobileOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 500 }}>{username}</span>
          </Space>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'deletedAt',
        key: 'status',
        render: (deletedAt: Date | null) => (
          <Tag color={deletedAt ? 'red' : 'green'}>
            {deletedAt ? 'Inativo' : 'Ativo'}
          </Tag>
        ),
        width: 100,
        align: 'center',
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
      {
        title: 'Criado por',
        dataIndex: 'createdBy',
        key: 'createdBy',
        width: 120,
        render: (createdBy: string) => (
          <Tag color="default">{createdBy}</Tag>
        ),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteMobileUser({ id: item?.id || 0 }),
            'Usuário móvel excluído com sucesso!'
          )
          .finally(() => {
            mobileUsers.mutate();
          }),
      customActions: [
        {
          key: 'reset-password',
          label: 'Reset Senha',
          icon: <LockOutlined />,
          type: 'link',
          confirm: {
            title: 'Reset de Senha',
            description: 'Uma nova senha será gerada e enviada via notificação push. Continuar?',
            okText: 'Reset',
            cancelText: 'Cancelar'
          },
          onClick: (mobileUser) =>
            controller
              .exec(
                () => resetMobileUserPassword({
                  userId: mobileUser?.id || 0,
                  sendNotification: true,
                  notifyUser: true
                }),
                'Senha resetada e notificação enviada!'
              )
              .finally(() => {
                mobileUsers.mutate();
              })
        }
      ]
    },
  );

  // Submit do formulário
  const handleSubmit = async (values: MobileUserFormData) => {
    const action = async (): Promise<ActionResult<MobileUser>> => {
      const mobileUser = controller.editingItem?.id
        ? await updateMobileUser({
          ...values,
          id: controller.editingItem.id,
          // Se estamos editando e as senhas estão vazias, não incluí-las
          ...(values.password ? {} : { password: undefined, confirmPassword: undefined }),
        })
        : await createMobileUser(values);

      return { success: true, data: mobileUser.data };
    };

    controller.exec(action, 'Usuário móvel salvo com sucesso!').finally(() => {
      mobileUsers.mutate();
    });
  };

  if (mobileUsers.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar usuários móveis.</p>;
  }

  return (
    <>
      <Card
        title={
          <Space>
            <MobileOutlined />
            Gerenciamento de Usuários Móveis
          </Space>
        }
        extra={
          <Button
            type="primary" 
            icon={<UserOutlined />}
            onClick={() => controller.open()}
          >
            Novo Usuário Móvel
          </Button>
        }
      >
        <Table<MobileUser>
          columns={columns}
          dataSource={mobileUsers.data}
          loading={mobileUsers.isLoading}
          rowKey="id"
          pagination={mobileUsers.pagination}
          onChange={mobileUsers.handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <MobileOutlined />
            {controller.editingItem ? 'Editar Usuário Móvel' : 'Novo Usuário Móvel'}
          </Space>
        }
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
        maskClosable={false}
      >
        <MobileUserForm
          initialValues={controller.editingItem ? {
            username: controller.editingItem.username,
            // Não incluir senhas para edição
          } : undefined}
          onSubmit={handleSubmit}
          loading={controller.loading}
          isEditing={!!controller.editingItem}
        />
      </Modal>
    </>
  );
}
