/**
 * Página de Gerenciamento de Períodos de Escala
 *
 * Lista e gerencia os períodos de escala das equipes
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import {
  listEscalasEquipePeriodo,
  createEscalaEquipePeriodo,
  updateEscalaEquipePeriodo,
  deleteEscalaEquipePeriodo,
  gerarSlotsEscala,
  publicarEscala,
  arquivarEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import EscalaEquipePeriodoForm from './form';

interface EscalaEquipePeriodo {
  id: number;
  equipeId: number;
  equipe: {
    id: number;
    nome: string;
  };
  periodoInicio: Date;
  periodoFim: Date;
  tipoEscalaId: number;
  tipoEscala: {
    id: number;
    nome: string;
  };
  status: 'RASCUNHO' | 'EM_APROVACAO' | 'PUBLICADA' | 'ARQUIVADA';
  versao: number;
  observacoes?: string;
  _count?: {
    Slots: number;
  };
}

const statusColors = {
  RASCUNHO: 'default',
  EM_APROVACAO: 'warning',
  PUBLICADA: 'success',
  ARQUIVADA: 'error',
} as const;

const statusLabels = {
  RASCUNHO: 'Rascunho',
  EM_APROVACAO: 'Em Aprovação',
  PUBLICADA: 'Publicada',
  ARQUIVADA: 'Arquivada',
};

export default function EscalaEquipePeriodoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EscalaEquipePeriodo | null>(null);

  const crud = useCrudController<EscalaEquipePeriodo>('escalaEquipePeriodo');

  const escalas = useEntityData<EscalaEquipePeriodo>({
    key: 'escalasEquipePeriodo',
    fetcher: unwrapFetcher(listEscalasEquipePeriodo),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'periodoInicio',
      orderDir: 'desc',
    },
  });

  const handleGerarSlots = async (record: EscalaEquipePeriodo) => {
    Modal.confirm({
      title: 'Gerar Slots de Escala',
      content: `Deseja gerar os slots para a escala da equipe ${record.equipe.nome}?`,
      okText: 'Sim, Gerar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const result = await gerarSlotsEscala({
            escalaEquipePeriodoId: record.id,
            mode: 'full',
          });

          if (result.success) {
            message.success(`${result.data.slotsGerados} slots gerados com sucesso!`);
            escalas.mutate();
          } else {
            message.error(result.error || 'Erro ao gerar slots');
          }
        } catch (error) {
          message.error('Erro ao gerar slots');
        }
      },
    });
  };

  const handlePublicar = async (record: EscalaEquipePeriodo) => {
    Modal.confirm({
      title: 'Publicar Escala',
      content: 'Após publicar, a escala não poderá ser editada. Deseja continuar?',
      okText: 'Sim, Publicar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const result = await publicarEscala({
            escalaEquipePeriodoId: record.id,
            validarComposicao: true,
          });

          if (result.success) {
            message.success('Escala publicada com sucesso!');
            escalas.mutate();
          } else {
            message.error(result.error || 'Erro ao publicar escala');
          }
        } catch (error) {
          message.error('Erro ao publicar escala');
        }
      },
    });
  };

  const handleArquivar = async (record: EscalaEquipePeriodo) => {
    Modal.confirm({
      title: 'Arquivar Escala',
      content: 'Deseja arquivar esta escala?',
      okText: 'Sim, Arquivar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const result = await arquivarEscala({
            escalaEquipePeriodoId: record.id,
          });

          if (result.success) {
            message.success('Escala arquivada com sucesso!');
            escalas.mutate();
          } else {
            message.error(result.error || 'Erro ao arquivar escala');
          }
        } catch (error) {
          message.error('Erro ao arquivar escala');
        }
      },
    });
  };

  const columns: ColumnsType<EscalaEquipePeriodo> = [
    {
      title: 'Equipe',
      key: 'equipe',
      render: (_: unknown, record: EscalaEquipePeriodo) => record.equipe.nome,
    },
    {
      title: 'Tipo',
      key: 'tipo',
      width: 120,
      render: (_: unknown, record: EscalaEquipePeriodo) => (
        <Tag color="blue">{record.tipoEscala.nome}</Tag>
      ),
    },
    {
      title: 'Período',
      key: 'periodo',
      width: 220,
      render: (_: unknown, record: EscalaEquipePeriodo) => (
        <span>
          {new Date(record.periodoInicio).toLocaleDateString()} até{' '}
          {new Date(record.periodoFim).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Versão',
      dataIndex: 'versao',
      key: 'versao',
      width: 80,
      render: (versao: number) => <Tag>v{versao}</Tag>,
    },
    {
      title: 'Slots',
      key: 'slots',
      width: 80,
      render: (_: unknown, record: EscalaEquipePeriodo) => (
        <Tag color={record._count?.Slots ? 'green' : 'default'}>
          {record._count?.Slots || 0}
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 250,
      render: (_: unknown, record: EscalaEquipePeriodo) => (
        <Space size="small">
          {record.status === 'RASCUNHO' && (
            <>
              <Tooltip title="Gerar Slots">
                <Button
                  type="link"
                  size="small"
                  icon={<CalendarOutlined />}
                  onClick={() => handleGerarSlots(record)}
                />
              </Tooltip>
              <Tooltip title="Publicar">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handlePublicar(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'PUBLICADA' && (
            <Tooltip title="Arquivar">
              <Button
                type="link"
                size="small"
                icon={<FileOutlined />}
                onClick={() => handleArquivar(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.status === 'PUBLICADA'}
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={record.status === 'PUBLICADA'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EscalaEquipePeriodo) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir este período de escala?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
        await crud.exec(
          () => deleteEscalaEquipePeriodo(id),
          'Período de escala excluído com sucesso!',
          () => escalas.mutate()
        );
      },
    });
  };

  const handleSave = async (values: unknown) => {
    const action = editingItem
      ? () => updateEscalaEquipePeriodo({ ...values, id: editingItem.id })
      : () => createEscalaEquipePeriodo(values);

    await crud.exec(
      action,
      editingItem ? 'Período de escala atualizado com sucesso!' : 'Período de escala criado com sucesso!',
      () => {
        escalas.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Períodos de Escala</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Novo Período
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={escalas.data}
        loading={escalas.isLoading}
        rowKey="id"
        pagination={escalas.pagination}
        onChange={escalas.handleTableChange}
      />

      <Modal
        title={editingItem ? 'Editar Período de Escala' : 'Novo Período de Escala'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <EscalaEquipePeriodoForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

