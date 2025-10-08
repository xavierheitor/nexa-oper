/**
 * Página de Gerenciamento de Catálogo de Horários
 *
 * Lista e gerencia os horários de trabalho (presets reutilizáveis)
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import {
  listHorarioAberturaCatalogo,
  createHorarioAberturaCatalogo,
  updateHorarioAberturaCatalogo,
  deleteHorarioAberturaCatalogo,
} from '@/lib/actions/escala/horarioAberturaCatalogo';
import HorarioAberturaCatalogoForm from './form';

interface HorarioAberturaCatalogo {
  id: number;
  nome: string;
  inicioTurnoHora: string;
  duracaoHoras: number;
  duracaoIntervaloHoras: number;
  ativo: boolean;
  observacoes?: string;
  _count?: {
    Historicos: number;
  };
}

export default function HorarioCatalogoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HorarioAberturaCatalogo | null>(null);

  const crud = useCrudController<HorarioAberturaCatalogo>('horarioAberturaCatalogo');

  const horarios = useEntityData({
    key: 'horarioAberturaCatalogo',
    fetcher: unwrapFetcher(listHorarioAberturaCatalogo) as any,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  const calcularHorarioFim = (inicio: string, duracao: number): string => {
    const [horas, minutos] = inicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracao * 60;
    const horasFim = Math.floor(totalMinutos / 60) % 24;
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
  };

  const columns: ColumnsType<HorarioAberturaCatalogo> = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Horário',
      key: 'horario',
      width: 250,
      render: (_: unknown, record: HorarioAberturaCatalogo) => {
        const fim = calcularHorarioFim(
          record.inicioTurnoHora,
          Number(record.duracaoHoras)
        );
        const intervalo = Number(record.duracaoIntervaloHoras) > 0
          ? ` (${record.duracaoIntervaloHoras}h intervalo)`
          : '';
        return (
          <Space>
            <ClockCircleOutlined />
            <span>
              {record.inicioTurnoHora.substring(0, 5)} às {fim} - {record.duracaoHoras}h{intervalo}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Status',
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
      title: 'Equipes Usando',
      key: 'uso',
      width: 120,
      render: (_: unknown, record: HorarioAberturaCatalogo) => (
        <Tag color="blue">
          {record._count?.Historicos || 0} equipe(s)
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: HorarioAberturaCatalogo) => (
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

  const handleEdit = (item: HorarioAberturaCatalogo) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: 'Tem certeza que deseja excluir este horário?',
      okText: 'Sim',
      cancelText: 'Não',
      onOk: async () => {
        await crud.exec(
          () => deleteHorarioAberturaCatalogo(id),
          'Horário excluído com sucesso!',
          () => horarios.mutate()
        );
      },
    });
  };

  const handleSave = async (values: unknown) => {
    const action = editingItem
      ? () => updateHorarioAberturaCatalogo({ ...(values as Record<string, unknown>), id: editingItem.id })
      : () => createHorarioAberturaCatalogo(values);

    await crud.exec(
      action,
      editingItem ? 'Horário atualizado com sucesso!' : 'Horário criado com sucesso!',
      () => {
        horarios.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Catálogo de Horários</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Novo Horário
        </Button>
      </div>

      <Table
        columns={columns as any}
        dataSource={horarios.data as HorarioAberturaCatalogo[]}
        loading={horarios.isLoading}
        rowKey="id"
        pagination={horarios.pagination}
        onChange={horarios.handleTableChange as any}
      />

      <Modal
        title={editingItem ? 'Editar Horário' : 'Novo Horário'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <HorarioAberturaCatalogoForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

