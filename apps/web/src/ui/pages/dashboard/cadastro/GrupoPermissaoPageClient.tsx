'use client';

import { App, Button, Card, Modal, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useAuth } from '@/lib/hooks/useAuth';
import { canManageUserPermissions } from '@/lib/authz/user-access';
import { createPermissionProfile } from '@/lib/actions/permissionProfile/create';
import { deletePermissionProfile } from '@/lib/actions/permissionProfile/delete';
import { listPermissionProfiles } from '@/lib/actions/permissionProfile/list';
import { updatePermissionProfile } from '@/lib/actions/permissionProfile/update';
import PermissionProfileForm, {
  type PermissionProfileFormData,
} from '@/ui/pages/dashboard/cadastro/grupo-permissao/form';
import type { Permission } from '@/lib/types/permissions';

const { Paragraph, Text } = Typography;

interface PermissionProfileListItem {
  id: number;
  key: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  permissions: Permission[];
  usersCount: number;
}

export default function GrupoPermissaoPageClient() {
  const { message } = App.useApp();
  const controller = useCrudController<PermissionProfileListItem>('permission-profiles');
  const { user } = useAuth({ redirectToLogin: false });

  const canManage = canManageUserPermissions(
    user?.roles || [],
    user?.permissions || [],
  );

  const {
    data: profiles,
    loading,
    error,
    refetch,
  } = useDataFetch<PermissionProfileListItem[]>(
    async () => {
      const result = await listPermissionProfiles({});

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Erro ao carregar grupos de permissão.');
    },
    [],
    {
      onError: () => {
        message.error('Erro ao carregar grupos de permissão.');
      },
    },
  );

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (nome: string, item: PermissionProfileListItem) => (
        <Space direction='vertical' size={0}>
          <Text strong>{nome}</Text>
          <Text type='secondary'>{item.key}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 120,
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'green' : 'default'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
    {
      title: 'Permissões',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 140,
      render: (permissions: Permission[]) => (
        <Tag color='blue'>{permissions.length}</Tag>
      ),
    },
    {
      title: 'Usuários',
      dataIndex: 'usersCount',
      key: 'usersCount',
      width: 120,
      render: (usersCount: number) => <Tag>{usersCount}</Tag>,
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (descricao: string | null) => (
        <Text type='secondary'>{descricao || 'Sem descrição'}</Text>
      ),
    },
    {
      title: 'Atualizado em',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
      render: (updatedAt: Date | null, item: PermissionProfileListItem) =>
        new Date(updatedAt || item.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      render: (_: unknown, item: PermissionProfileListItem) => (
        <Space>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => controller.open(item)}
            disabled={!canManage}
          >
            Editar
          </Button>
          <Popconfirm
            title='Excluir grupo'
            description='O grupo será removido definitivamente.'
            okText='Excluir'
            cancelText='Cancelar'
            onConfirm={() =>
              controller.exec(
                () => deletePermissionProfile({ profileId: item.id }),
                'Grupo excluído com sucesso!',
                () => {
                  refetch();
                },
              )
            }
            disabled={!canManage}
          >
            <Button
              type='link'
              danger
              icon={<DeleteOutlined />}
              disabled={!canManage}
            >
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: PermissionProfileFormData) => {
    const action = controller.editingItem
      ? () =>
          updatePermissionProfile({
            profileId: controller.editingItem!.id,
            ...values,
          })
      : () => createPermissionProfile(values);

    await controller.exec(
      action,
      controller.editingItem
        ? 'Grupo atualizado com sucesso!'
        : 'Grupo criado com sucesso!',
      () => {
        refetch();
        controller.close();
      },
    );
  };

  if (loading && !profiles) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  return (
    <>
      <Card
        title='Grupos de Permissão'
        extra={
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => controller.open()}
            disabled={!canManage}
          >
            Novo grupo
          </Button>
        }
      >
        <Paragraph type='secondary'>
          Crie grupos base de permissões para aplicar um conjunto padrão aos
          usuários web. Depois, os usuários ainda podem receber permissões
          extras individuais no modal de permissões.
        </Paragraph>

        {error ? (
          <Text type='danger'>Erro ao carregar grupos de permissão.</Text>
        ) : (
          <Table<PermissionProfileListItem>
            rowKey='id'
            loading={loading}
            columns={columns}
            dataSource={profiles || []}
            pagination={{
              pageSize: 10,
              hideOnSinglePage: true,
            }}
          />
        )}
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Grupo de Permissão' : 'Novo Grupo de Permissão'}
        open={controller.isOpen}
        onCancel={() => {
          void controller.close();
        }}
        footer={null}
        destroyOnHidden
        width={960}
      >
        <PermissionProfileForm
          initialValues={
            controller.editingItem
              ? {
                  ...controller.editingItem,
                  descricao: controller.editingItem.descricao ?? undefined,
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
