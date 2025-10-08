/**
 * Página de Gerenciamento de Papéis de Equipe
 *
 * Permite cadastro, edição e listagem de papéis de equipe
 * (Líder, Motorista, Montador, etc) utilizados nas escalas
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, message, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import {
  listPapeisEquipe,
  createPapelEquipe,
  updatePapelEquipe,
  deletePapelEquipe,
} from '@/lib/actions/escala/papelEquipe';
import PapelEquipeForm from './form';

interface PapelEquipe {
  id: number;
  nome: string;
  ativo: boolean;
  exigeHabilitacao: boolean;
  prioridadeEscala?: number;
}

export default function PapelEquipePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PapelEquipe | null>(null);

  // Hook para controle CRUD
  const crud = useCrudController<PapelEquipe>('papelEquipe');

  // Hook para dados paginados
  const papeis = useEntityData({
    key: 'papeisEquipe',
    fetcher: unwrapFetcher(listPapeisEquipe) as any,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  // Definição das colunas da tabela
  const columns: ColumnsType<PapelEquipe> = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: true,
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 100,
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'green' : 'red'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
    {
      title: 'Exige Habilitação',
      dataIndex: 'exigeHabilitacao',
      key: 'exigeHabilitacao',
      width: 150,
      render: (exige: boolean) => (
        <Switch checked={exige} disabled size="small" />
      ),
    },
    {
      title: 'Prioridade',
      dataIndex: 'prioridadeEscala',
      key: 'prioridadeEscala',
      width: 100,
      render: (prioridade?: number) => prioridade || '-',
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: PapelEquipe) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  // Handlers
  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: PapelEquipe) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir este papel de equipe?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
      await crud.exec(
        () => deletePapelEquipe(id),
        'Papel de equipe excluído com sucesso!',
        () => papeis.mutate()
      );
      },
    });
  };

  const handleSave = async (values: unknown) => {
    const action = editingItem
      ? () => updatePapelEquipe({ ...(values as Record<string, unknown>), id: editingItem.id })
      : () => createPapelEquipe(values);

    await crud.exec(
      action,
      editingItem ? 'Papel de equipe atualizado com sucesso!' : 'Papel de equipe criado com sucesso!',
      () => {
        papeis.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Papéis de Equipe</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Novo Papel
        </Button>
      </div>

      <Table
        columns={columns as any}
        dataSource={papeis.data as PapelEquipe[]}
        loading={papeis.isLoading}
        rowKey="id"
        pagination={papeis.pagination}
        onChange={papeis.handleTableChange as any}
      />

      <Modal
        title={editingItem ? 'Editar Papel de Equipe' : 'Novo Papel de Equipe'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <PapelEquipeForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

