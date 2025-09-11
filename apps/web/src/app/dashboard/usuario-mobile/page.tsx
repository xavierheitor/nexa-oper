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
import { Button, Card, Modal, Space, Table } from 'antd';

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
        width: 80,
        sorter: true,
      },
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        sorter: true,
        ...getTextFilter('username', 'Buscar por username'),
        render: (username: string) => (
          <Space>
            <MobileOutlined style={{ color: '#1890ff' }} />
            <strong>{username}</strong>
          </Space>
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
      if (controller.editingItem) {
        // Atualização
        return updateMobileUser({
          id: controller.editingItem.id,
          ...values,
        });
      } else {
        // Criação
        return createMobileUser(values);
      }
    };

    await controller
      .exec(
        action,
        controller.editingItem
          ? 'Usuário móvel atualizado com sucesso!'
          : 'Usuário móvel criado com sucesso!'
      )
      .finally(() => {
        mobileUsers.mutate();
      });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header da página */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          <MobileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Usuários Móveis
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          Gerencie usuários para acesso via aplicativo móvel
        </p>
      </div>

      {/* Card principal */}
      <Card>
        {/* Barra de ações */}
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => controller.open()}
          >
            Novo Usuário Móvel
          </Button>
        </div>

        {/* Tabela */}
        <Table
          columns={columns}
          dataSource={mobileUsers.data || []}
          rowKey="id"
          loading={mobileUsers.isLoading}
          pagination={mobileUsers.pagination}
          onChange={mobileUsers.handleTableChange}
        />
      </Card>

      {/* Modal do formulário */}
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
        width={600}
        destroyOnHidden
      >
        <MobileUserForm
          onSubmit={handleSubmit}
          initialValues={controller.editingItem || undefined}
          loading={controller.loading}
          isEditing={!!controller.editingItem}
        />
      </Modal>
    </div>
  );
}
