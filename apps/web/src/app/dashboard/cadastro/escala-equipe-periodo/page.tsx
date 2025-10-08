/**
 * Página de Gerenciamento de Períodos de Escala
 *
 * Lista e gerencia os períodos de escala das equipes
 */

'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, message, Select, DatePicker, Form } from 'antd';
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
  atribuirEletricistas,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import EscalaEquipePeriodoForm from './form';
import EscalaWizard from './wizard';
import VisualizarEscala from './visualizar';
import dayjs from 'dayjs';

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
    minEletricistasPorTurno: number | null;
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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EscalaEquipePeriodo | null>(null);
  const [isAtribuirModalOpen, setIsAtribuirModalOpen] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<EscalaEquipePeriodo | null>(null);
  const [selectedEletricistas, setSelectedEletricistas] = useState<number[]>([]);
  const [eletricistas, setEletricistas] = useState<Array<{ id: number; nome: string }>>([]);
  const [loadingEletricistas, setLoadingEletricistas] = useState(false);
  const [proximasFolgas, setProximasFolgas] = useState<Record<number, Date>>({});
  const [atribuirForm] = Form.useForm();
  const [isVisualizarOpen, setIsVisualizarOpen] = useState(false);
  const [visualizarEscalaId, setVisualizarEscalaId] = useState<number | null>(null);

  const crud = useCrudController<EscalaEquipePeriodo>('escalaEquipePeriodo');

  const escalas = useEntityData({
    key: 'escalasEquipePeriodo',
    fetcher: unwrapFetcher(listEscalasEquipePeriodo) as any,
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

  const handleVisualizar = (record: EscalaEquipePeriodo) => {
    setVisualizarEscalaId(record.id);
    setIsVisualizarOpen(true);
  };

  const handleOpenAtribuir = async (record: EscalaEquipePeriodo) => {
    setSelectedEscala(record);
    setSelectedEletricistas([]);
    setProximasFolgas({});
    atribuirForm.resetFields();
    setLoadingEletricistas(true);

    try {
      // Buscar eletricistas da equipe
      const result = await listEletricistas({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (result.success && result.data) {
        setEletricistas(result.data.data);
      }
    } catch (error) {
      message.error('Erro ao carregar eletricistas');
    } finally {
      setLoadingEletricistas(false);
    }

    setIsAtribuirModalOpen(true);
  };

  const handleConfirmAtribuir = async () => {
    if (!selectedEscala) return;

    // Validar quantidade de eletricistas baseado no tipo de escala
    const required = selectedEscala.tipoEscala.minEletricistasPorTurno || 2;

    if (selectedEletricistas.length !== required) {
      message.warning(`Selecione exatamente ${required} eletricistas para este tipo de escala`);
      return;
    }

    // Para escala com ciclo, validar que todas as datas de folga foram informadas
    const isCiclo = selectedEscala.tipoEscala.modoRepeticao === 'CICLO_DIAS';
    if (isCiclo) {
      const faltamDatas = selectedEletricistas.some(id => !proximasFolgas[id]);
      if (faltamDatas) {
        message.warning('Informe a data da próxima folga para todos os eletricistas');
        return;
      }
    }

    try {
      const eletricistasData = isCiclo
        ? selectedEletricistas.map(id => ({
          eletricistaId: id,
          proximaFolga: proximasFolgas[id],
        }))
        : selectedEletricistas.map(id => ({
          eletricistaId: id,
          proximaFolga: selectedEscala.periodoInicio, // Não importa para Semanal
        }));

      const result = await atribuirEletricistas({
        escalaEquipePeriodoId: selectedEscala.id,
        eletricistas: eletricistasData,
      });

      if (result.success && result.data) {
        message.success(`${result.data.atribuicoesGeradas} atribuições criadas com sucesso!`);
        setIsAtribuirModalOpen(false);
        escalas.mutate();
      } else {
        message.error(result.error || 'Erro ao atribuir eletricistas');
      }
    } catch (error) {
      message.error('Erro ao atribuir eletricistas');
    }
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
              <Tooltip title="Gerar Slots">
                <Button
                  type="link"
                  size="small"
                  icon={<CalendarOutlined />}
                  onClick={() => handleGerarSlots(record)}
                />
              </Tooltip>
              {record._count?.Slots ? (
                <Tooltip title="Atribuir Eletricistas">
                  <Button
                    type="link"
                    size="small"
                    icon={<TeamOutlined />}
                    onClick={() => handleOpenAtribuir(record)}
                  />
                </Tooltip>
              ) : null}
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
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Novo Período
          </Button>
        </Space>
      </div>

      <Table
        columns={columns as any}
        dataSource={escalas.data as EscalaEquipePeriodo[]}
        loading={escalas.isLoading}
        rowKey="id"
        pagination={escalas.pagination}
        onChange={escalas.handleTableChange as any}
      />

      {/* Modal Wizard (Novo Período Guiado) */}
      <Modal
        title="Nova Escala - Assistente"
        open={isWizardOpen}
        onCancel={() => setIsWizardOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
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

      <Modal
        title="Atribuir Eletricistas"
        open={isAtribuirModalOpen}
        onCancel={() => setIsAtribuirModalOpen(false)}
        onOk={handleConfirmAtribuir}
        okText="Atribuir"
        cancelText="Cancelar"
        width={700}
      >
        {selectedEscala && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <p><strong>Equipe:</strong> {selectedEscala.equipe.nome}</p>
              <p><strong>Tipo de Escala:</strong> {selectedEscala.tipoEscala.nome}</p>
              <p><strong>Período:</strong> {new Date(selectedEscala.periodoInicio).toLocaleDateString()} até {new Date(selectedEscala.periodoFim).toLocaleDateString()}</p>
              <p><strong>Slots Gerados:</strong> {selectedEscala._count?.Slots || 0}</p>
            </div>

            <div>
              <p style={{ marginBottom: 8, fontWeight: 'bold' }}>
                Selecione os Eletricistas:
              </p>
              <p style={{ marginBottom: 16, color: '#666', fontSize: '13px' }}>
                {selectedEscala.tipoEscala.modoRepeticao === 'CICLO_DIAS' ? (
                  <>
                    <strong>{selectedEscala.tipoEscala.nome}:</strong> Selecione <strong>{selectedEscala.tipoEscala.minEletricistasPorTurno || 3} eletricistas</strong>.
                    <br />
                    Cada um trabalha em ciclos defasados para garantir cobertura contínua.
                  </>
                ) : (
                  <>
                    <strong>{selectedEscala.tipoEscala.nome}:</strong> Selecione <strong>{selectedEscala.tipoEscala.minEletricistasPorTurno || 2} eletricistas</strong>.
                    <br />
                    Eles trabalham sempre juntos nos mesmos dias.
                  </>
                )}
              </p>

              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Selecione os eletricistas"
                value={selectedEletricistas}
                onChange={(values) => {
                  setSelectedEletricistas(values);
                  // Limpar datas de folga de eletricistas removidos
                  setProximasFolgas(prev => {
                    const newFolgas: Record<number, Date> = {};
                    values.forEach(id => {
                      if (prev[id]) {
                        newFolgas[id] = prev[id];
                      }
                    });
                    return newFolgas;
                  });
                }}
                loading={loadingEletricistas}
                maxCount={selectedEscala.tipoEscala.minEletricistasPorTurno || 2}
                options={eletricistas.map(e => ({
                  label: e.nome,
                  value: e.id,
                }))}
              />
            </div>

            {/* Datas de próxima folga para escala com ciclo */}
            {selectedEscala.tipoEscala.modoRepeticao === 'CICLO_DIAS' &&
              selectedEletricistas.length > 0 && (
                <div>
                  <p style={{ marginBottom: 16, fontWeight: 'bold' }}>
                    📅 Informe a data da próxima folga de cada eletricista:
                  </p>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {selectedEletricistas.map(eletId => {
                      const elet = eletricistas.find(e => e.id === eletId);
                      return (
                        <div key={eletId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, fontWeight: 500 }}>
                            {elet?.nome}
                          </div>
                          <DatePicker
                            placeholder="Próxima folga"
                            style={{ width: 200 }}
                            format="DD/MM/YYYY"
                            value={proximasFolgas[eletId] ? dayjs(proximasFolgas[eletId]) : null}
                            onChange={(date) => {
                              if (date) {
                                setProximasFolgas(prev => ({
                                  ...prev,
                                  [eletId]: date.toDate(),
                                }));
                              }
                            }}
                            disabledDate={(current) => {
                              if (!current) return false;
                              const date = current.toDate();
                              return date < new Date(selectedEscala.periodoInicio) ||
                                date > new Date(selectedEscala.periodoFim);
                            }}
                          />
                        </div>
                      );
                    })}
                  </Space>
                  <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                    💡 A próxima folga determina o início do ciclo deste eletricista
                  </p>
                </div>
              )}

            {selectedEletricistas.length > 0 && (
              <div style={{ padding: 12, background: '#e6f4ff', borderRadius: 8, border: '1px solid #91caff' }}>
                <strong>✓ Selecionados:</strong> {selectedEletricistas.length} de {selectedEscala.tipoEscala.minEletricistasPorTurno || 2} necessários
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* Modal de Visualização */}
      {visualizarEscalaId && (
        <VisualizarEscala
          escalaId={visualizarEscalaId}
          open={isVisualizarOpen}
          onClose={() => {
            setIsVisualizarOpen(false);
            setVisualizarEscalaId(null);
          }}
        />
      )}
    </div>
  );
}

