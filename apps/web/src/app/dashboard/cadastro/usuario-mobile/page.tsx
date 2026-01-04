'use client';

import React, { useState } from 'react';
import { Card, Table, Modal, Button, Space, Tag, Spin } from 'antd';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { MobileOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { getTextFilter } from '@/ui/components/tableFilters';
import { createMobileUser } from '@/lib/actions/mobileUser/create';
import { updateMobileUser } from '@/lib/actions/mobileUser/update';
import { deleteMobileUser } from '@/lib/actions/mobileUser/delete';
import { listMobileUsers } from '@/lib/actions/mobileUser/list';
import MobileUserForm from './form';
import PermissoesModal from './permissoesModal';
import type { MobileUser } from '@nexa-oper/db';

export default function MobileUserPage() {
  const controller = useCrudController<MobileUser>('mobileUsers');
  const [permissoesModalOpen, setPermissoesModalOpen] = useState(false);
  const [selectedUserForPermissoes, setSelectedUserForPermissoes] = useState<MobileUser | null>(null);

  const mobileUsers = useEntityData<MobileUser>({
    key: 'mobileUsers',
    fetcherAction: unwrapFetcher(listMobileUsers),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'username',
      orderDir: 'asc',
    },
  });

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createMobileUser,
    updateAction: updateMobileUser,
    onSuccess: () => mobileUsers.mutate(),
    successMessage: 'Usuário móvel salvo com sucesso!',
  });

  const handleOpenPermissoes = (user: MobileUser) => {
    setSelectedUserForPermissoes(user);
    setPermissoesModalOpen(true);
  };

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
        ...getTextFilter<MobileUser>('username', 'username'),
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'green' : 'default'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        width: 120,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteMobileUser({ id: item.id }),
            'Usuário móvel excluído com sucesso!'
          )
          .finally(() => mobileUsers.mutate()),
      customActions: [
        {
          key: 'permissoes',
          label: 'Permissões',
          icon: <KeyOutlined />,
          type: 'link',
          onClick: handleOpenPermissoes,
        },
      ],
    }
  );

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (mobileUsers.error) return <p style={{ color: 'red' }}>Erro ao carregar usuários móveis.</p>;

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

      {/* Modal de Permissões */}
      <Modal
        title="Gerenciar Permissões"
        open={permissoesModalOpen}
        onCancel={() => {
          setPermissoesModalOpen(false);
          setSelectedUserForPermissoes(null);
        }}
        footer={null}
        destroyOnHidden
        width={800}
      >
        {selectedUserForPermissoes && (
          <PermissoesModal
            mobileUserId={selectedUserForPermissoes.id}
            mobileUserName={selectedUserForPermissoes.username}
            onSaved={() => {
              mobileUsers.mutate();
              setPermissoesModalOpen(false);
              setSelectedUserForPermissoes(null);
            }}
            controllerExec={controller.exec}
          />
        )}
      </Modal>
    </>
  );
}
