'use client';

import { createUser } from '@/lib/actions/user/create';
import { deleteUser } from '@/lib/actions/user/delete';
import { listUsers } from '@/lib/actions/user/list';
import { resetUserPassword } from '@/lib/actions/user/resetPassword';
import { updateUser } from '@/lib/actions/user/update';

import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { User } from '@nexa-oper/db';
import { Button, Card, Modal, Space, Table, Tag } from 'antd';

import UserForm, { UserFormData } from './form';

export default function UserPage() {
  // Controller CRUD
  const controller = useCrudController<User>('usuarios');

  // Dados da tabela
  const users = useEntityData<User>({
    key: 'usuarios',
    fetcherAction: unwrapFetcher(listUsers),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  // Configuração das colunas
  const columns = useTableColumnsWithActions<User>(
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
        ...getTextFilter<User>('nome', 'nome do usuário'),
        render: (nome: string, record: User) => (
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 500 }}>{nome}</span>
          </Space>
        ),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        sorter: true,
        ...getTextFilter<User>('email', 'email do usuário'),
        render: (email: string) => (
          <Space>
            <MailOutlined style={{ color: '#52c41a' }} />
            <span>{email}</span>
          </Space>
        ),
      },
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        sorter: true,
        ...getTextFilter<User>('username', 'username do usuário'),
        render: (username: string) => (
          <Tag color="blue">{username}</Tag>
        ),
        width: 150,
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
            () => deleteUser({ id: item.id }),
            'Usuário excluído com sucesso!'
          )
          .finally(() => {
            users.mutate();
          }),
      customActions: [
        {
          key: 'reset-password',
          label: 'Reset Senha',
          icon: <LockOutlined />,
          type: 'link',
          confirm: {
            title: 'Reset de Senha',
            description: 'Uma nova senha será gerada e enviada por email. Continuar?',
            okText: 'Reset',
            cancelText: 'Cancelar'
          },
          onClick: (user) =>
            controller
              .exec(
                () => resetUserPassword({
                  userId: user.id,
                  sendEmail: true,
                  notifyUser: true
                }),
                'Senha resetada e enviada por email!'
              )
              .finally(() => {
                users.mutate();
              })
        }
      ]
    },
  );

  // Submit do formulário
  const handleSubmit = async (values: UserFormData) => {
    const action = async (): Promise<ActionResult<User>> => {
      const result = controller.editingItem?.id
        ? await updateUser({
          ...values,
          id: controller.editingItem.id,
            // Se estamos editando e as senhas estão vazias, não incluí-las
            ...(values.password ? {} : { password: undefined, confirmPassword: undefined }),
          })
        : await createUser(values);

      return result;
    };

    controller.exec(action, 'Usuário salvo com sucesso!').finally(() => {
      users.mutate();
    });
  };

  if (users.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar usuários.</p>;
  }

  return (
    <>
      <Card
        title={
          <Space>
            <UserOutlined />
            Gerenciamento de Usuários
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => controller.open()}
          >
            Novo Usuário
          </Button>
        }
      >
        <Table<User>
          columns={columns}
          dataSource={users.data}
          loading={users.isLoading}
          rowKey="id"
          pagination={users.pagination}
          onChange={users.handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <UserOutlined />
            {controller.editingItem ? 'Editar Usuário' : 'Novo Usuário'}
          </Space>
        }
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
        maskClosable={false}
      >
        <UserForm
          initialValues={controller.editingItem ? {
            nome: controller.editingItem.nome,
            email: controller.editingItem.email,
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
