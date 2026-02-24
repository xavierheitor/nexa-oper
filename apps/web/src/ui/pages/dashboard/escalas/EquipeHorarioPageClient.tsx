/**
 * Página de Associação de Equipes a Horários
 *
 * Gerencia qual horário cada equipe usa e em qual período
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table, Button, Space, Modal, Tag, Tooltip, App, Card, Row, Col, Select } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';
import {
  listEquipeTurnoHistorico,
  createEquipeTurnoHistorico,
  updateEquipeTurnoHistorico,
  deleteEquipeTurnoHistorico,
} from '@/lib/actions/escala/equipeTurnoHistorico';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { listHorarioAberturaCatalogo } from '@/lib/actions/escala/horarioAberturaCatalogo';
import EquipeTurnoHistoricoForm from '@/ui/pages/dashboard/escalas/equipe-horario/form';

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
  observacoes: string | null;
}

export default function EquipeHorarioPage() {
  const { modal } = App.useApp();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipeTurnoHistorico | null>(null);
  const [initialEquipeId, setInitialEquipeId] = useState<number | null>(null);

  // Estados dos filtros
  const [filtroBase, setFiltroBase] = useState<number | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<number | undefined>(undefined);
  const [filtroHorario, setFiltroHorario] = useState<number | undefined>(undefined);
  const [filtroVigente, setFiltroVigente] = useState<boolean | undefined>(undefined);

  const crud = useCrudController<EquipeTurnoHistorico>('equipeTurnoHistorico');

  // Verificar se há equipeId na query string e abrir modal automaticamente
  useEffect(() => {
    const equipeId = searchParams.get('equipeId');
    if (equipeId && !isModalOpen) {
      const equipeIdNum = parseInt(equipeId, 10);
      if (!isNaN(equipeIdNum)) {
        setInitialEquipeId(equipeIdNum);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, isModalOpen]);

  // Carregar dados para os filtros
  const { data: bases } = useEntityData({
    key: 'bases-filtro-equipe-horario',
    fetcherAction: unwrapFetcher((params) => listBases({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      ...params,
    })),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: tiposEquipe } = useEntityData({
    key: 'tipos-equipe-filtro-equipe-horario',
    fetcherAction: unwrapFetcher((params) => listTiposEquipe({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      ...params,
    })),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: horarios } = useEntityData({
    key: 'horarios-filtro-equipe-horario',
    fetcherAction: async (params: any) => {
      const result = await listHorarioAberturaCatalogo({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: true,
        ...params,
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  const basesOptions = useSelectOptions(bases, { labelKey: 'nome', valueKey: 'id' });
  const tiposEquipeOptions = useSelectOptions(tiposEquipe, { labelKey: 'nome', valueKey: 'id' });
  const horariosOptions = useSelectOptions(horarios, { labelKey: 'nome', valueKey: 'id' });

  // Criar fetcher que inclui os filtros
  const associacoesFetcher = useMemo(
    () =>
      unwrapFetcher((params: any) =>
        listEquipeTurnoHistorico({
          ...params,
          baseId: filtroBase,
          tipoEquipeId: filtroTipoEquipe,
          horarioAberturaCatalogoId: filtroHorario,
          vigente: filtroVigente,
        })
      ),
    [filtroBase, filtroTipoEquipe, filtroHorario, filtroVigente]
  );

  // Chave do SWR incluindo filtros
  const associacoesKey = useMemo(
    () =>
      `equipeTurnoHistorico-${filtroBase || 'all'}-${filtroTipoEquipe || 'all'}-${filtroHorario || 'all'}-${filtroVigente !== undefined ? filtroVigente : 'all'}`,
    [filtroBase, filtroTipoEquipe, filtroHorario, filtroVigente]
  );

  const associacoes = useEntityData({
    key: associacoesKey,
    fetcherAction: async (params: any) => {
      const data = await associacoesFetcher(params);
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

  // Resetar para página 1 quando os filtros mudarem
  const prevFiltersRef = useRef<{ filtroBase?: number; filtroTipoEquipe?: number; filtroHorario?: number; filtroVigente?: boolean }>({});
  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.filtroBase !== filtroBase ||
      prevFiltersRef.current.filtroTipoEquipe !== filtroTipoEquipe ||
      prevFiltersRef.current.filtroHorario !== filtroHorario ||
      prevFiltersRef.current.filtroVigente !== filtroVigente;

    if (filtersChanged) {
      associacoes.setParams((prev) => ({
        ...prev,
        page: 1,
      }));
      prevFiltersRef.current = { filtroBase, filtroTipoEquipe, filtroHorario, filtroVigente };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroBase, filtroTipoEquipe, filtroHorario, filtroVigente]);

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
    setInitialEquipeId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EquipeTurnoHistorico) => {
    // Converter Decimal para number antes de passar para o formulário
    setEditingItem({
      ...item,
      duracaoHoras: Number(item.duracaoHoras),
      duracaoIntervaloHoras: Number(item.duracaoIntervaloHoras),
    });
    setInitialEquipeId(null);
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
        setInitialEquipeId(null);
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

      {/* Card de Filtros */}
      <Card
        size="small"
        title={
          <Space>
            <FilterOutlined />
            <span>Filtros</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Base</div>
              <Select
                placeholder="Todas as bases"
                allowClear
                value={filtroBase}
                onChange={(value) => setFiltroBase(value || undefined)}
                options={basesOptions}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Tipo de Equipe</div>
              <Select
                placeholder="Todos os tipos"
                allowClear
                value={filtroTipoEquipe}
                onChange={(value) => setFiltroTipoEquipe(value || undefined)}
                options={tiposEquipeOptions}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Horário</div>
              <Select
                placeholder="Todos os horários"
                allowClear
                value={filtroHorario}
                onChange={(value) => setFiltroHorario(value || undefined)}
                options={horariosOptions}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Status</div>
              <Select
                placeholder="Todos"
                allowClear
                value={filtroVigente}
                onChange={(value) => setFiltroVigente(value !== undefined ? value : undefined)}
                style={{ width: '100%' }}
                options={[
                  { label: 'Vigente', value: true },
                  { label: 'Inativo', value: false },
                ]}
              />
            </div>
          </Col>
        </Row>
      </Card>

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
        onCancel={() => {
          setIsModalOpen(false);
          setInitialEquipeId(null);
        }}
        footer={null}
        width={700}
      >
        <EquipeTurnoHistoricoForm
          initialValues={
            editingItem
              ? {
                id: editingItem.id,
                equipeId: editingItem.equipeId,
                horarioAberturaCatalogoId: editingItem.horarioAberturaCatalogoId,
                dataInicio: editingItem.dataInicio,
                dataFim: editingItem.dataFim,
                inicioTurnoHora: editingItem.inicioTurnoHora,
                duracaoHoras: editingItem.duracaoHoras,
                duracaoIntervaloHoras: editingItem.duracaoIntervaloHoras,
                motivo: editingItem.motivo,
                observacoes: editingItem.observacoes,
              }
              : initialEquipeId
                ? {
                  equipeId: initialEquipeId,
                  dataInicio: new Date(),
                  dataFim: null,
                }
                : undefined
          }
          onSubmit={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setInitialEquipeId(null);
          }}
        />
      </Modal>
    </div>
  );
}

