/**
 * Página de Gerenciamento de Períodos de Escala
 *
 * Lista e gerencia os períodos de escala das equipes
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, App, Alert, DatePicker, Form, Select, Card, Row, Col } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FileOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';
import {
  listEscalasEquipePeriodo,
  createEscalaEquipePeriodo,
  updateEscalaEquipePeriodo,
  deleteEscalaEquipePeriodo,
  gerarSlotsEscala,
  publicarEscala,
  arquivarEscala,
  prolongarEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import { publicarEscalasEmLote } from '@/lib/actions/escala/publicarEmLote';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import EscalaEquipePeriodoForm from './form';
import EscalaWizard from './wizard';
import EscalaEditWizard from './edit-wizard';
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
  const [isEditWizardOpen, setIsEditWizardOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EscalaEquipePeriodo | null>(null);
  const [isVisualizarOpen, setIsVisualizarOpen] = useState(false);
  const [visualizarEscalaId, setVisualizarEscalaId] = useState<number | null>(null);
  const [isVisualizacaoGeralOpen, setIsVisualizacaoGeralOpen] = useState(false);
  const [isProlongarOpen, setIsProlongarOpen] = useState(false);
  const [escalaParaProlongar, setEscalaParaProlongar] = useState<EscalaEquipePeriodo | null>(null);
  const [formProlongar] = Form.useForm<{ novoPeriodoFim: dayjs.Dayjs }>();

  // Estado para filtro de período (mês atual por padrão)
  const [mesFiltro, setMesFiltro] = useState<Dayjs>(dayjs());

  // Estados para filtros adicionais
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<number | undefined>(undefined);
  const [filtroBase, setFiltroBase] = useState<number | undefined>(undefined);
  const [filtroTipoEscala, setFiltroTipoEscala] = useState<number | undefined>(undefined);
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined);

  // Calcular período de início e fim do mês selecionado
  const periodoFiltro = useMemo(() => {
    const inicioMes = mesFiltro.startOf('month').toDate();
    const fimMes = mesFiltro.endOf('month').toDate();
    return { periodoInicio: inicioMes, periodoFim: fimMes };
  }, [mesFiltro]);

  // Carregar dados para os filtros
  // ✅ CORREÇÃO: Garantir que os parâmetros sempre sejam passados mesmo quando paginationEnabled: false
  const { data: bases } = useEntityData({
    key: 'bases-filtro-escala',
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
    key: 'tipos-equipe-filtro-escala',
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

  const { data: tiposEscala } = useEntityData({
    key: 'tipos-escala-filtro-escala',
    fetcherAction: unwrapFetcher((params) => listTiposEscala({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      ativo: true,
      ...params,
    })),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const basesOptions = useSelectOptions(bases, { labelKey: 'nome', valueKey: 'id' });
  const tiposEquipeOptions = useSelectOptions(tiposEquipe, { labelKey: 'nome', valueKey: 'id' });
  const tiposEscalaOptions = useSelectOptions(tiposEscala, { labelKey: 'nome', valueKey: 'id' });

  const crud = useCrudController<EscalaEquipePeriodo>('escalaEquipePeriodo');

  // Criar fetcher que inclui os filtros customizados
  const escalasFetcher = useMemo(
    () =>
      unwrapFetcher((params) =>
        listEscalasEquipePeriodo({
          ...params,
          ...periodoFiltro,
          tipoEquipeId: filtroTipoEquipe,
          baseId: filtroBase,
          tipoEscalaId: filtroTipoEscala,
          status: filtroStatus as 'RASCUNHO' | 'EM_APROVACAO' | 'PUBLICADA' | 'ARQUIVADA' | undefined,
        })
      ),
    [periodoFiltro, filtroTipoEquipe, filtroBase, filtroTipoEscala, filtroStatus]
  );

  // ✅ CORREÇÃO: Incluir filtros na chave do SWR para garantir revalidação quando os filtros mudarem
  const escalasKey = useMemo(
    () =>
      `escalasEquipePeriodo-${mesFiltro.format('YYYY-MM')}-${filtroTipoEquipe || 'all'}-${filtroBase || 'all'}-${filtroTipoEscala || 'all'}-${filtroStatus || 'all'}`,
    [mesFiltro, filtroTipoEquipe, filtroBase, filtroTipoEscala, filtroStatus]
  );

  const escalas = useEntityData({
    key: escalasKey,
    fetcherAction: escalasFetcher,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'periodoInicio',
      orderDir: 'desc',
    },
  });

  // ✅ CORREÇÃO: Resetar para página 1 quando os filtros mudarem (mas não quando a página mudar pelo usuário)
  const prevFiltersRef = React.useRef({ mesFiltro, filtroTipoEquipe, filtroBase, filtroTipoEscala, filtroStatus });
  useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.mesFiltro !== mesFiltro ||
      prevFiltersRef.current.filtroTipoEquipe !== filtroTipoEquipe ||
      prevFiltersRef.current.filtroBase !== filtroBase ||
      prevFiltersRef.current.filtroTipoEscala !== filtroTipoEscala ||
      prevFiltersRef.current.filtroStatus !== filtroStatus;

    if (filtersChanged) {
      escalas.setParams((prev) => ({
        ...prev,
        page: 1,
      }));
      prevFiltersRef.current = { mesFiltro, filtroTipoEquipe, filtroBase, filtroTipoEscala, filtroStatus };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesFiltro, filtroTipoEquipe, filtroBase, filtroTipoEscala, filtroStatus]);

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
            await escalas.mutate();
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
            await escalas.mutate();
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
            await escalas.mutate();
          } else {
            message.error(result.error || 'Erro ao arquivar escala');
          }
        } catch (error) {
          message.error('Erro ao arquivar escala');
        }
      },
    });
  };

  const handleProlongar = (record: EscalaEquipePeriodo) => {
    setEscalaParaProlongar(record);
    formProlongar.setFieldsValue({
      novoPeriodoFim: dayjs(record.periodoFim).add(1, 'month'),
    });
    setIsProlongarOpen(true);
  };

  const handleConfirmarProlongar = async () => {
    if (!escalaParaProlongar) return;

    try {
      const values = await formProlongar.validateFields();
      const result = await prolongarEscala({
        escalaEquipePeriodoId: escalaParaProlongar.id,
        novoPeriodoFim: values.novoPeriodoFim.toDate(),
      });

      if (result.success) {
        message.success('Escala prolongada com sucesso! A escala voltou para status RASCUNHO e pode ser publicada novamente.');
        await escalas.mutate();
        setIsProlongarOpen(false);
        setEscalaParaProlongar(null);
        formProlongar.resetFields();
      } else {
        message.error(result.error || 'Erro ao prolongar escala');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // Erro de validação do formulário
        return;
      }
      message.error('Erro ao prolongar escala');
    }
  };

  const handlePublicarTodas = async () => {
    // Filtrar escalas em rascunho
    // escalas.data pode não ter equipe e tipoEscala incluídos, então fazemos cast
    const escalasData = (escalas.data || []) as Array<EscalaEquipePeriodo | Omit<EscalaEquipePeriodo, 'equipe' | 'tipoEscala'>>;
    const escalasRascunho = escalasData.filter(
      (e) => e.status === 'RASCUNHO'
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
            {escalasRascunho.map(e => {
              const escala = e as EscalaEquipePeriodo;
              return (
                <li key={e.id}>
                  <strong>{escala.equipe?.nome || 'N/A'}</strong> - {escala.tipoEscala?.nome || 'N/A'}
                </li>
              );
            })}
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

            await escalas.mutate();
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
            <>
              <Tooltip title="Prolongar Escala">
                <Button
                  type="link"
                  size="small"
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleProlongar(record)}
                />
              </Tooltip>
              <Tooltip title="Arquivar">
                <Button
                  type="link"
                  size="small"
                  icon={<FileOutlined />}
                  onClick={() => handleArquivar(record)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title={record.status === 'PUBLICADA' ? 'Edição desabilitada após publicação' : 'Editar'}>
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
    // Se está em RASCUNHO, usar wizard de edição completa
    if (item.status === 'RASCUNHO') {
      setEditingItem(item);
      setIsEditWizardOpen(true);
    } else {
    // Para outros status, usar formulário simples (não deveria acontecer, mas mantém compatibilidade)
      setEditingItem(item);
      setIsModalOpen(true);
    }
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
          async () => await escalas.mutate()
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
      async () => {
        await escalas.mutate();
        setIsModalOpen(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                // @ts-ignore - escalas.data não possui tipagem completa no runtime
                ((escalas.data || []).filter(e => e.status === 'RASCUNHO').length === 0)
              }
            >
              Publicar Todas
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nova Escala
            </Button>
          </Space>
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
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Mês</div>
                <DatePicker
                  picker="month"
                  format="MM/YYYY"
                  value={mesFiltro}
                  onChange={(date) => {
                    if (date) {
                      setMesFiltro(date);
                    }
                  }}
                  placeholder="Selecione o mês"
                  style={{ width: '100%' }}
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
                />
              </div>
            </Col>
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
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Tipo de Escala</div>
                <Select
                  placeholder="Todos os tipos"
                  allowClear
                  value={filtroTipoEscala}
                  onChange={(value) => setFiltroTipoEscala(value || undefined)}
                  options={tiposEscalaOptions}
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Status</div>
                <Select
                  placeholder="Todos os status"
                  allowClear
                  value={filtroStatus}
                  onChange={(value) => setFiltroStatus(value || undefined)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="RASCUNHO">Rascunho</Select.Option>
                  <Select.Option value="EM_APROVACAO">Em Aprovação</Select.Option>
                  <Select.Option value="PUBLICADA">Publicada</Select.Option>
                  <Select.Option value="ARQUIVADA">Arquivada</Select.Option>
                </Select>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <Table
        // @ts-ignore - tipagem do Table não cobre o formato de columns usado
        columns={columns}
        // @ts-ignore - tipagem do Table não cobre o formato de dataSource usado
        dataSource={escalas.data || []}
        loading={escalas.isLoading}
        rowKey="id"
        pagination={escalas.pagination}
        onChange={escalas.handleTableChange}
      />

      {/* Modal Wizard (Novo Período Guiado) */}
      <Modal
        title="Nova Escala - Assistente"
        open={isWizardOpen}
        onCancel={async () => {
          setIsWizardOpen(false);
          await escalas.mutate();
        }}
        footer={null}
        width={800}
        destroyOnHidden
        maskClosable={false} // Não fecha ao clicar fora
        keyboard={false} // Não fecha com ESC
        closable={true} // Mantém o botão X (só fecha via botões "Cancelar" ou X)
      >
        <EscalaWizard
          onFinish={async () => {
            setIsWizardOpen(false);
            await escalas.mutate();
          }}
          onCancel={async () => {
            setIsWizardOpen(false);
            await escalas.mutate();
          }}
        />
      </Modal>

      {/* Modal Wizard de Edição */}
      {editingItem && editingItem.status === 'RASCUNHO' && (
        <Modal
          title="Editar Escala - Assistente"
          open={isEditWizardOpen}
          onCancel={async () => {
            setIsEditWizardOpen(false);
            setEditingItem(null);
            await escalas.mutate();
          }}
          footer={null}
          width={800}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
          closable={true}
        >
          <EscalaEditWizard
            escalaId={editingItem.id}
            onFinish={async () => {
              setIsEditWizardOpen(false);
              setEditingItem(null);
              await escalas.mutate();
            }}
            onCancel={async () => {
              setIsEditWizardOpen(false);
              setEditingItem(null);
              await escalas.mutate();
            }}
          />
        </Modal>
      )}

      {/* Modal Formulário Simples (Edição) */}
      <Modal
        title={editingItem ? 'Editar Período de Escala' : 'Novo Período de Escala'}
        open={isModalOpen}
        onCancel={async () => {
          setIsModalOpen(false);
          await escalas.mutate();
        }}
        footer={null}
        width={700}
      >
        <EscalaEquipePeriodoForm
          initialValues={editingItem || undefined}
          onSubmit={handleSave}
          onCancel={async () => {
            setIsModalOpen(false);
            await escalas.mutate();
          }}
        />
      </Modal>

      {/* Modal de Visualização Geral (Agrupada por Base) */}
      <VisualizacaoGeral
        open={isVisualizacaoGeralOpen && !isVisualizarOpen}
        onClose={async () => {
          setIsVisualizacaoGeralOpen(false);
          await escalas.mutate();
        }}
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
          onClose={async () => {
            setIsVisualizarOpen(false);
            setVisualizarEscalaId(null);
            await escalas.mutate();
            // Ao fechar, volta para a visualização geral se ela estava aberta
            // O estado isVisualizacaoGeralOpen permanece true, então ela reaparece
          }}
        />
      )}

      {/* Modal de Prolongar Escala */}
      <Modal
        title="Prolongar Escala"
        open={isProlongarOpen}
        onOk={handleConfirmarProlongar}
        onCancel={async () => {
          setIsProlongarOpen(false);
          setEscalaParaProlongar(null);
          formProlongar.resetFields();
          await escalas.mutate();
        }}
        okText="Prolongar"
        cancelText="Cancelar"
        width={500}
      >
        {escalaParaProlongar && (
          <div>
            <Alert
              message="Prolongar Escala"
              description={
                <div>
                  <p>Esta escala será prolongada para um período adicional.</p>
                  <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    <strong>Equipe:</strong> {escalaParaProlongar.equipe.nome}<br />
                    <strong>Período atual:</strong> {new Date(escalaParaProlongar.periodoInicio).toLocaleDateString()} até {new Date(escalaParaProlongar.periodoFim).toLocaleDateString()}
                  </p>
                  <p style={{ marginTop: 8, fontSize: '12px', color: '#1890ff' }}>
                    Após prolongar, a escala voltará para status <strong>RASCUNHO</strong> e poderá ser publicada novamente.
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={formProlongar} layout="vertical">
              <Form.Item
                name="novoPeriodoFim"
                label="Novo Período Fim"
                rules={[
                  { required: true, message: 'Data de fim é obrigatória' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const periodoFimAtual = new Date(escalaParaProlongar.periodoFim);
                      if (value.toDate() <= periodoFimAtual) {
                        return Promise.reject(new Error('A nova data de fim deve ser maior que a data de fim atual'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Selecione a nova data de fim"
                  disabledDate={(current) => {
                    const periodoFimAtual = new Date(escalaParaProlongar.periodoFim);
                    return current && current.isBefore(dayjs(periodoFimAtual).add(1, 'day'), 'day');
                  }}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
