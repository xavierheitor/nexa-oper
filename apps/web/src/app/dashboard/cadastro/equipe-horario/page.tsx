/**
 * Página de Associação de Equipes a Horários
 *
 * Gerencia qual horário cada equipe usa e em qual período
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, App } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import {
  listEquipeTurnoHistorico,
  createEquipeTurnoHistorico,
  updateEquipeTurnoHistorico,
  deleteEquipeTurnoHistorico,
} from '@/lib/actions/escala/equipeTurnoHistorico';
import EquipeTurnoHistoricoForm from './form';

interface EquipeTurnoHistorico {
  id: number;
  equipeId: number;
  equipe: {
    id: number;
    nome: string;
  };
  horarioAberturaCatalogoId: number | null;
  horarioAberturaCatalogo: {
    id: number;
    nome: string;
  } | null;
  inicioTurnoHora: string;
  duracaoHoras: number;
  duracaoIntervaloHoras: number;
  fimTurnoHora: string | null;
  dataInicio: Date;
  dataFim: Date | null;
  motivo: string | null;
}

export default function EquipeHorarioPage() {
  const { modal } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipeTurnoHistorico | null>(null);

  const crud = useCrudController<EquipeTurnoHistorico>('equipeTurnoHistorico');

  const associacoes = useEntityData({
    key: 'equipeTurnoHistorico',
    fetcherAction: async (params: any) => {
      const data = await unwrapFetcher(listEquipeTurnoHistorico)(params);
      // Converter Decimal para number para evitar erro de serialização
      return data.map((item: any) => ({
        ...item,
        duracaoHoras: Number(item.duracaoHoras),
        duracaoIntervaloHoras: Number(item.duracaoIntervaloHoras),
      }));
    },
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'dataInicio',
      orderDir: 'desc',
    },
  });

  const isVigente = (registro: EquipeTurnoHistorico): boolean => {
    const hoje = new Date();
    const inicio = new Date(registro.dataInicio);
    const fim = registro.dataFim ? new Date(registro.dataFim) : null;
    return inicio <= hoje && (!fim || fim >= hoje);
  };

  const columns: ColumnsType<EquipeTurnoHistorico> = [
    {
      title: 'Equipe',
      key: 'equipe',
      render: (_: unknown, record: EquipeTurnoHistorico) => (
        <Space>
          <TeamOutlined />
          {record.equipe.nome}
        </Space>
      ),
    },
    {
      title: 'Horário',
      key: 'horario',
      width: 280,
      render: (_: unknown, record: EquipeTurnoHistorico) => {
        const intervalo = Number(record.duracaoIntervaloHoras) > 0
          ? ` + ${record.duracaoIntervaloHoras}h int.`
          : '';

        return (
          <Space direction="vertical" size={0}>
            {record.horarioAberturaCatalogo && (
              <Tag color="blue">{record.horarioAberturaCatalogo.nome}</Tag>
            )}
            <Space>
              <ClockCircleOutlined />
              <span>
                {record.inicioTurnoHora.substring(0, 5)} às{' '}
                {record.fimTurnoHora?.substring(0, 5)} ({record.duracaoHoras}h{intervalo})
              </span>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Vigência',
      key: 'vigencia',
      width: 220,
      render: (_: unknown, record: EquipeTurnoHistorico) => (
        <span>
          {new Date(record.dataInicio).toLocaleDateString()} até{' '}
          {record.dataFim
            ? new Date(record.dataFim).toLocaleDateString()
            : 'Atual'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: EquipeTurnoHistorico) => {
        const vigente = isVigente(record);
        return (
          <Tag color={vigente ? 'green' : 'default'} icon={vigente ? <CheckCircleOutlined /> : undefined}>
            {vigente ? 'Vigente' : 'Inativo'}
          </Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: EquipeTurnoHistorico) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
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

  const handleEdit = (item: EquipeTurnoHistorico) => {
    // Converter Decimal para number antes de passar para o formulário
    setEditingItem({
      ...item,
      duracaoHoras: Number(item.duracaoHoras),
      duracaoIntervaloHoras: Number(item.duracaoIntervaloHoras),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir esta associação?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
        await crud.exec(
          () => deleteEquipeTurnoHistorico(id),
          'Associação excluída com sucesso!',
          () => associacoes.mutate()
        );
      },
    });
  };

  const handleSave = async (values: unknown) => {
    const action = editingItem
      ? () => updateEquipeTurnoHistorico({ ...(values as Record<string, unknown>), id: editingItem.id })
      : () => createEquipeTurnoHistorico(values);

    await crud.exec(
      action,
      editingItem ? 'Associação atualizada com sucesso!' : 'Associação criada com sucesso!',
      () => {
        associacoes.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Horários das Equipes</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Associar Equipe a Horário
        </Button>
      </div>

      <Table
        columns={columns as any}
        dataSource={associacoes.data as EquipeTurnoHistorico[]}
        loading={associacoes.isLoading}
        rowKey="id"
        pagination={associacoes.pagination}
        onChange={associacoes.handleTableChange as any}
      />

      <Modal
        title={editingItem ? 'Editar Associação' : 'Nova Associação'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <EquipeTurnoHistoricoForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

