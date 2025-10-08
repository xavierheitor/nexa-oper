/**
 * Página de Gerenciamento de Tipos de Escala
 *
 * Permite cadastro, edição e listagem de tipos de escala
 * (4x2, 5x1, Espanhola, etc)
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, message, Tag, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import {
  listTiposEscala,
  createTipoEscala,
  updateTipoEscala,
  deleteTipoEscala,
} from '@/lib/actions/escala/tipoEscala';
import TipoEscalaForm from './form';


interface TipoEscala {
  id: number;
  nome: string;
  modoRepeticao: 'CICLO_DIAS' | 'SEMANA_DEPENDENTE';
  cicloDias?: number;
  periodicidadeSemanas?: number;
  eletricistasPorTurma?: number;
  ativo: boolean;
  observacoes?: string;
  _count?: {
    CicloPosicoes: number;
    SemanaMascaras: number;
  };
}

export default function TipoEscalaPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoEscala | null>(null);

  const crud = useCrudController<TipoEscala>('tipoEscala');

  const tipos = useEntityData({
    key: 'tiposEscala',
    fetcher: unwrapFetcher(listTiposEscala) as any,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const columns: ColumnsType<TipoEscala> = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: true,
    },
    {
      title: 'Modo',
      dataIndex: 'modoRepeticao',
      key: 'modoRepeticao',
      width: 180,
      render: (modo: string) => (
        <Tag color={modo === 'CICLO_DIAS' ? 'blue' : 'purple'}>
          {modo === 'CICLO_DIAS' ? 'Ciclo de Dias' : 'Semana Dependente'}
        </Tag>
      ),
    },
    {
      title: 'Ciclo/Semanas',
      key: 'config',
      width: 150,
      render: (_: unknown, record: TipoEscala) => {
        if (record.modoRepeticao === 'CICLO_DIAS') {
          return `${record.cicloDias} dias`;
        }
        return `${record.periodicidadeSemanas} semanas`;
      },
    },
    {
      title: 'Eletricistas/Turma',
      dataIndex: 'eletricistasPorTurma',
      key: 'eletricistasPorTurma',
      width: 150,
      render: (qtd?: number) => qtd || '-',
    },
    {
      title: 'Posições',
      key: 'posicoes',
      width: 120,
      render: (_: unknown, record: TipoEscala) => {
        const count = record.modoRepeticao === 'CICLO_DIAS'
          ? record._count?.CicloPosicoes || 0
          : record._count?.SemanaMascaras || 0;
        return <Badge count={count} showZero color="blue" />;
      },
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
      title: 'Ações',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: TipoEscala) => (
        <Space size="small">
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => router.push(`/dashboard/cadastro/tipo-escala/${record.id}`)}
          >
            Configurar
          </Button>
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

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: TipoEscala) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir este tipo de escala?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
        await crud.exec(
          () => deleteTipoEscala(id),
          'Tipo de escala excluído com sucesso!',
          () => tipos.mutate()
        );
      },
    });
  };

  const handleSave = async (values: unknown) => {
    const action = editingItem
      ? () => updateTipoEscala({ ...(values as Record<string, unknown>), id: editingItem.id })
      : () => createTipoEscala(values);

    await crud.exec(
      action,
      editingItem ? 'Tipo de escala atualizado com sucesso!' : 'Tipo de escala criado com sucesso!',
      () => {
        tipos.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Tipos de Escala</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Novo Tipo
        </Button>
      </div>

      <Table
        columns={columns as any}
        dataSource={tipos.data as TipoEscala[]}
        loading={tipos.isLoading}
        rowKey="id"
        pagination={tipos.pagination}
        onChange={tipos.handleTableChange as any}
      />

      <Modal
        title={editingItem ? 'Editar Tipo de Escala' : 'Novo Tipo de Escala'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <TipoEscalaForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

