// @ts-nocheck
/**
 * Página de Gerenciamento de Períodos de Escala
 *
 * Lista e gerencia os períodos de escala das equipes
 */
'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, App, Alert } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileOutlined,
  TeamOutlined,
  EyeOutlined,
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
import { publicarEscalasEmLote } from '@/lib/actions/escala/publicarEmLote';
import EscalaEquipePeriodoForm from './form';
import EscalaWizard from './wizard';
import VisualizarEscala from './visualizar';
import VisualizacaoGeral from './visualizacao-geral';

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
    modoRepeticao: string;
    eletricistasPorTurma: number | null;
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
  const { message, modal } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EscalaEquipePeriodo | null>(null);
  const [isVisualizarOpen, setIsVisualizarOpen] = useState(false);
  const [visualizarEscalaId, setVisualizarEscalaId] = useState<number | null>(null);
  const [isVisualizacaoGeralOpen, setIsVisualizacaoGeralOpen] = useState(false);

  const crud = useCrudController<EscalaEquipePeriodo>('escalaEquipePeriodo');

  const escalas = useEntityData({
    key: 'escalasEquipePeriodo',
    fetcherAction: unwrapFetcher(listEscalasEquipePeriodo),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'periodoInicio',
      orderDir: 'desc',
    },
  });

  const handleGerarSlots = async (record: EscalaEquipePeriodo) => {
    const isPublicada = record.status === 'PUBLICADA';

    modal.confirm({
      title: 'Gerar Slots de Escala',
      content: (
        <div>
          <p>Deseja gerar os slots para a escala da equipe {record.equipe.nome}?</p>
          {isPublicada && (
            <Alert
              message="Escala Publicada"
              description="Esta escala já está publicada. Apenas slots de dias futuros (a partir de hoje) serão gerados/atualizados. Dias passados são preservados como histórico."
              type="info"
              showIcon
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      ),
      okText: 'Sim, Gerar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const result = await gerarSlotsEscala({
            escalaEquipePeriodoId: record.id,
            mode: 'full',
          });

          if (result.success && result.data) {
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
    modal.confirm({
      title: 'Publicar Escala',
      content: (
        <div>
          <p>Após publicar, a escala estará disponível para uso.</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Nota: A validação de composição mínima está desabilitada.
            Você pode publicar mesmo que nem todos os dias tenham a quantidade ideal de eletricistas.
          </p>
        </div>
      ),
      okText: 'Sim, Publicar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const result = await publicarEscala({
            escalaEquipePeriodoId: record.id,
            validarComposicao: false, // ✅ Validação desabilitada - pode publicar com qualquer composição
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
    modal.confirm({
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

  const handlePublicarTodas = async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const escalasRascunho: EscalaEquipePeriodo[] = (escalas.data as unknown as EscalaEquipePeriodo[]).filter(
      e => e.status === 'RASCUNHO'
    );

    if (escalasRascunho.length === 0) {
      message.info('Não há escalas em rascunho para publicar');
      return;
    }

    modal.confirm({
      title: 'Publicar Todas as Escalas em Rascunho',
      content: (
        <div>
          <p>Você está prestes a publicar <strong>{escalasRascunho.length} escala(s)</strong> em rascunho.</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: 12 }}>
            Escalas que serão publicadas:
          </p>
          <ul style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {escalasRascunho.map(e => (
              <li key={e.id}>
                <strong>{e.equipe.nome}</strong> - {e.tipoEscala.nome}
              </li>
            ))}
          </ul>
        </div>
      ),
      okText: 'Sim, Publicar Todas',
      cancelText: 'Cancelar',
      width: 600,
      onOk: async () => {
        try {
          const result = await publicarEscalasEmLote({
            escalasIds: escalasRascunho.map(e => e.id),
            validarComposicao: false,
          });

          if (result.success && result.data) {
            const { sucesso, falhas, erros } = result.data;

            if (falhas === 0) {
              message.success(`✅ ${sucesso} escala(s) publicada(s) com sucesso!`);
            } else {
              message.warning(
                `Publicação parcial: ${sucesso} sucesso, ${falhas} falha(s). ` +
                `Verifique as escalas com erro.`
              );

              // Mostra erros específicos
              erros.forEach(erro => {
                console.error(`Escala ID ${erro.id}: ${erro.erro}`);
              });
            }

            escalas.mutate();
          } else {
            message.error(result.error || 'Erro ao publicar escalas');
          }
        } catch (error) {
          message.error('Erro ao publicar escalas');
        }
      },
    });
  };

  const handleVisualizar = (record: EscalaEquipePeriodo) => {
    setVisualizarEscalaId(record.id);
    setIsVisualizarOpen(true);
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
          {record._count?.Slots ? (
            <Tooltip title="Visualizar Escala">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleVisualizar(record)}
              />
            </Tooltip>
          ) : null}
          {record.status === 'RASCUNHO' && (
            <>

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
    setIsWizardOpen(true);
  };

  const handleCreateOldForm = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: EscalaEquipePeriodo) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
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
      ? () => updateEscalaEquipePeriodo({ ...(values as Record<string, unknown>), id: editingItem.id })
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
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setIsVisualizacaoGeralOpen(true)}
          >
            Visualização Geral
          </Button>
          <Button
            icon={<CheckCircleOutlined />}
            onClick={handlePublicarTodas}
            disabled={
              !escalas.data ||
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              ((escalas.data as unknown as EscalaEquipePeriodo[]).filter(e => e.status === 'RASCUNHO').length === 0)
            }
          >
            Publicar Todas
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Novo Período
          </Button>
        </Space>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Table
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        columns={columns}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        dataSource={escalas.data as unknown as EscalaEquipePeriodo[]}
        loading={escalas.isLoading}
        rowKey="id"
        pagination={escalas.pagination}
        onChange={escalas.handleTableChange}
      />

      {/* Modal Wizard (Novo Período Guiado) */}
      <Modal
        title="Nova Escala - Assistente"
        open={isWizardOpen}
        onCancel={() => setIsWizardOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
        maskClosable={false} // Não fecha ao clicar fora
        keyboard={false} // Não fecha com ESC
        closable={true} // Mantém o botão X (só fecha via botões "Cancelar" ou X)
      >
        <EscalaWizard
          onFinish={() => {
            setIsWizardOpen(false);
            escalas.mutate();
          }}
          onCancel={() => setIsWizardOpen(false)}
        />
      </Modal>

      {/* Modal Formulário Simples (Edição) */}
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

      {/* Modal de Visualização Geral (Agrupada por Base) */}
      <VisualizacaoGeral
        open={isVisualizacaoGeralOpen && !isVisualizarOpen}
        onClose={() => setIsVisualizacaoGeralOpen(false)}
        onVisualizarEscala={(escalaId) => {
          setVisualizarEscalaId(escalaId);
          setIsVisualizarOpen(true);
          // NÃO fecha o modal geral - apenas oculta temporariamente
        }}
      />

      {/* Modal de Visualização Individual - renderizado por cima */}
      {visualizarEscalaId && (
        <VisualizarEscala
          escalaId={visualizarEscalaId}
          open={isVisualizarOpen}
          onClose={() => {
            setIsVisualizarOpen(false);
            setVisualizarEscalaId(null);
            // Ao fechar, volta para a visualização geral se ela estava aberta
            // O estado isVisualizacaoGeralOpen permanece true, então ela reaparece
          }}
        />
      )}
    </div>
  );
}

