'use client';

import { createUser } from '@/lib/actions/user/create';
import { deleteUser } from '@/lib/actions/user/delete';
import { listUsers } from '@/lib/actions/user/list';
import { resetUserPassword } from '@/lib/actions/user/resetPassword';
import { updateUser } from '@/lib/actions/user/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { User } from '@nexa-oper/db';
import { Space, Spin, Tag } from 'antd';
import UserForm, { UserFormData } from './form';

export default function UserPage() {
  const controller = useCrudController<User>('usuarios');

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

  const handleSubmit = useCrudFormHandler<UserFormData, User>({
    controller: controller as any, // Type cast needed due to ActionResult generic mismatch
    createAction: createUser as any,
    updateAction: ((data: UserFormData & { id: number }) => updateUser({
      ...data,
      // Se estamos editando e as senhas estão vazias, não incluí-las
      ...(data.password ? {} : { password: undefined, confirmPassword: undefined }),
    })) as any,
    onSuccess: () => users.mutate(),
    successMessage: 'Usuário salvo com sucesso!',
  });

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

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <CrudPage
      title="Usuários"
      entityKey="usuarios"
      controller={controller}
      entityData={users}
      columns={columns}
      formComponent={UserForm}
      onSubmit={handleSubmit}
      modalWidth={600}
    />
  );
}
