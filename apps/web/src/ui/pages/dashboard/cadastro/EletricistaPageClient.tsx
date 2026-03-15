'use client';

import { useState } from 'react';

// Importações das Server Actions para buscar dados dos selects
import { listEletricistas } from '@/lib/actions/eletricista/list';
import { createEletricistasLote } from '@/lib/actions/eletricista/createLote';
import { listContratos } from '@/lib/actions/contrato/list';
import { listCargos } from '@/lib/actions/cargo/list';
import { listBases } from '@/lib/actions/base/list';
import {
  canCreateElectricians,
  canDeleteElectricians,
  canUpdateElectricians,
} from '@/lib/authz/registry-access';

// Tipos do Prisma
import { Base, Cargo, Contrato, Eletricista } from '@nexa-oper/db';

// Schemas e utils de status
import { StatusEletricistaLabels, StatusEletricistaColors, StatusEletricista } from '@/lib/schemas/eletricistaStatusSchema';

// Importações do hook e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { App, Button, Card, Input, Modal, Space, Spin, Table, Tag } from 'antd';
import { SwapOutlined, PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import { createEletricista } from '@/lib/actions/eletricista/create';
import { deleteEletricista } from '@/lib/actions/eletricista/delete';
import { transferEletricistaBase } from '@/lib/actions/eletricista/transferBase';
import { registrarStatusEletricista } from '@/lib/actions/eletricista/registrarStatus';
import { updateEletricista } from '@/lib/actions/eletricista/update';
import { ActionResult, PaginatedResult } from '@/lib/types/common';
import TransferBaseModal from '@/ui/components/TransferBaseModal';
import AlterarStatusModal from '@/ui/components/AlterarStatusModal';
import { getTextFilter } from '@/ui/components/tableFilters';
import TableExternalFilters from '@/ui/components/TableExternalFilters';
import EletricistaForm, { EletricistaFormData } from '@/ui/pages/dashboard/cadastro/eletricista/form';
import EletricistaLoteForm, {
  type EletricistaLoteFormData,
} from '@/ui/pages/dashboard/cadastro/eletricista/lote-form';

type EletricistaWithBase = Eletricista & {
  baseAtual?: Base | null;
  Status?: { status: StatusEletricista } | null;
  cargo?: Cargo | null;
};

interface EletricistaPageClientProps {
  initialEletricistas?: PaginatedResult<EletricistaWithBase>;
  initialContratos?: Contrato[];
  initialCargos?: Cargo[];
  initialBases?: Base[];
}

export default function EletricistaPageClient({
  initialEletricistas,
  initialContratos = [],
  initialCargos = [],
  initialBases = [],
}: EletricistaPageClientProps) {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'eletricistas' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<EletricistaWithBase>('eletricistas');
  const { user } = useAuth({ redirectToLogin: false });
  // Hook para gerenciar mensagens
  const { message } = App.useApp();
  // Estado para controlar a transferência de base
  const [transferTarget, setTransferTarget] = useState<EletricistaWithBase | null>(null);
  // Estado para controlar o loading da transferência de base
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  // Estado para controlar o modal de cadastro em lote
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  // Estado para controlar o loading do cadastro em lote
  const [isLoteLoading, setIsLoteLoading] = useState(false);
  // Estado para controlar o modal de alteração de status
  const [statusTarget, setStatusTarget] = useState<EletricistaWithBase | null>(null);
  // Estado para controlar o loading da alteração de status
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];
  const canCreate = canCreateElectricians(userRoles, userPermissions);
  const canUpdate = canUpdateElectricians(userRoles, userPermissions);
  const canDelete = canDeleteElectricians(userRoles, userPermissions);


  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const eletricistas = useEntityData<EletricistaWithBase>({
    key: 'eletricistas', // Chave única para o cache SWR
    fetcherAction: unwrapPaginatedFetcher(listEletricistas), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialData: initialEletricistas,
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
      include: {
        contrato: true, // Inclui dados do contrato
        cargo: true, // Inclui dados do cargo
        Status: true, // Inclui status atual do eletricista
      },
    },
  });

  // Hooks para dados necessários no formulário de lote
  const contratos = useEntityData<Contrato>({
    key: 'contratos-lote',
    fetcherAction: unwrapFetcher(listContratos),
    initialData: initialContratos,
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const cargos = useEntityData<Cargo>({
    key: 'cargos-lote',
    fetcherAction: unwrapFetcher(listCargos),
    initialData: initialCargos,
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const bases = useEntityData<Base>({
    key: 'bases-lote',
    fetcherAction: unwrapFetcher(listBases),
    initialData: initialBases,
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  // Debug: Log dos dados carregados
  // console.log('🔍 Dados para o formulário de lote:', {
  //   contratos: {
  //     total: contratos.data?.length || 0,
  //     primeiros: contratos.data?.slice(0, 2),
  //     isLoading: contratos.isLoading,
  //   },
  //   cargos: {
  //     total: cargos.data?.length || 0,
  //     primeiros: cargos.data?.slice(0, 2),
  //     isLoading: cargos.isLoading,
  //   },
  //   bases: {
  //     total: bases.data?.length || 0,
  //     primeiros: bases.data?.slice(0, 2),
  //     isLoading: bases.isLoading,
  //   },
  // });


  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<EletricistaWithBase>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto Eletricista
        key: 'id', // Chave única da coluna
        sorter: true, // Habilita ordenação por esta coluna
        width: 80, // Largura fixa da coluna
      },
      // Coluna Nome - com filtro de texto integrado
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true, // Permite ordenação
        ...getTextFilter<Eletricista>('nome', 'nome do eletricista'), // Adiciona filtro de busca textual
      },
      // Coluna Matrícula - com filtro de texto integrado
      {
        title: 'Matrícula',
        dataIndex: 'matricula',
        key: 'matricula',
        sorter: true, // Permite ordenação
        ...getTextFilter<Eletricista>('matricula', 'matrícula do eletricista'), // Adiciona filtro de busca textual
      },
      // Coluna Telefone - com filtro de texto integrado
      // {
      //   title: 'Telefone',
      //   dataIndex: 'telefone',
      //   key: 'telefone',
      //   sorter: true, // Permite ordenação
      //   ...getTextFilter<Eletricista>('telefone', 'telefone do eletricista'), // Adiciona filtro de busca textual
      // },

      {
        title: 'Admissão',
        dataIndex: 'admissao',
        key: 'admissao',
        sorter: true, // Permite ordenação
        ...getTextFilter<Eletricista>('admissao', 'data de admissão do eletricista'), // Adiciona filtro de busca textual
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
      },
      // Coluna Cargo
      {
        title: 'Cargo',
        key: 'cargo',
        render: (_: unknown, record: EletricistaWithBase) => record.cargo?.nome || '-',
        width: 150,
      },
      // Coluna Estado
      // {
      //   title: 'Estado',
      //   dataIndex: 'estado',
      //   key: 'estado',
      //   sorter: true,
      //   width: 100,
      // },
      // Coluna Base Atual
      {
        title: 'Base Atual',
        dataIndex: 'baseAtual',
        key: 'baseAtual',
        render: (baseAtual: Base | null | undefined) => {
          return baseAtual ? (
            <Tag color="green">{baseAtual.nome}</Tag>
          ) : (
            <Tag color="red">Sem lotação</Tag>
          );
        },
        width: 120,
      },
      // Coluna Status
      {
        title: 'Status',
        key: 'status',
        width: 150,
        sorter: (a: EletricistaWithBase, b: EletricistaWithBase) => {
          const statusA = a.Status?.status || 'ATIVO';
          const statusB = b.Status?.status || 'ATIVO';
          return statusA.localeCompare(statusB);
        },
        render: (_: unknown, record: EletricistaWithBase) => {
          const status = record.Status?.status || 'ATIVO';
          return (
            <Tag color={StatusEletricistaColors[status]}>
              {StatusEletricistaLabels[status]}
            </Tag>
          );
        },
        filters: Object.entries(StatusEletricistaLabels).map(([value, label]) => ({
          text: label,
          value,
        })),
        onFilter: (value, record: EletricistaWithBase) => {
          const status = record.Status?.status || 'ATIVO';
          return status === value;
        },
      },
    ],
    {
      onEdit: canUpdate ? controller.open : undefined,
      onDelete: canDelete
        ? (item) =>
            controller
              .exec(
                () => deleteEletricista({ id: item.id }), // Server Action de exclusão
                'Eletricista excluído com sucesso!' // Mensagem de sucesso
              )
              .finally(() => {
                eletricistas.mutate(); // Revalida os dados da tabela após exclusão
              })
        : undefined,

      // Ações customizadas
      customActions: [
        {
          key: 'alterar-status',
          label: '',
          type: 'link',
          icon: <EditOutlined />,
          tooltip: 'Alterar status do eletricista',
          visible: () => canUpdate,
          onClick: (record) => {
            setStatusTarget(record);
          },
        },
        {
          key: 'transfer-base',
          label: '',
          type: 'link',
          icon: <SwapOutlined />,
          tooltip: 'Transferir eletricista para outra base',
          visible: () => canUpdate,
          onClick: (record) => {
            setTransferTarget(record);
          },
        },
      ],
    },
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: EletricistaFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<Eletricista>> => {
      const payload = {
        ...values,
        contratoId: Number(values.contratoId),
        baseId: Number(values.baseId),
        // Converter Dayjs para Date ou string ISO
        admissao: values.admissao ? (values.admissao instanceof Date ? values.admissao : new Date(values.admissao)) : undefined,
      };

      // Verifica se estamos editando (tem item selecionado) ou criando
      const result = controller.editingItem?.id
        ? await updateEletricista({
          ...payload, // Dados do formulário normalizados
          id: controller.editingItem.id,
        })
        : await createEletricista(payload); // Apenas dados do formulário para criação

      // IMPORTANTE: Retornar o resultado original do backend
      // Se houver erro, o controller.exec vai tratá-lo corretamente
      return result;
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Eletricista salvo com sucesso!').finally(() => {
      eletricistas.mutate(); // Revalida os dados da tabela após salvar
    });
  };

  const handleLoteSubmit = async (values: EletricistaLoteFormData) => {
    setIsLoteLoading(true);
    try {
      const result = await createEletricistasLote(values);

      if (result.success && result.data) {
        message.success(`${result.data.eletricistasCriados} eletricista(s) cadastrado(s) com sucesso!`);
        setIsLoteModalOpen(false);
        eletricistas.mutate(); // Revalida a lista
      } else {
        message.error(result.error || 'Erro ao cadastrar eletricistas em lote');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar eletricistas em lote';
      message.error(errorMessage);
    } finally {
      setIsLoteLoading(false);
    }
  };

  const closeTransferModal = () => {
    if (isTransferLoading) {
      return;
    }
    setTransferTarget(null);
  };

  const closeStatusModal = () => {
    if (isStatusLoading) {
      return;
    }
    setStatusTarget(null);
  };

  const handleAlterarStatus = async (data: {
    status: StatusEletricista;
    dataInicio: Date;
    dataFim?: Date;
    motivo?: string;
    observacoes?: string;
  }) => {
    if (!statusTarget) {
      return;
    }

    setIsStatusLoading(true);

    try {
      const result = await registrarStatusEletricista({
        eletricistaId: statusTarget.id,
        status: data.status,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        motivo: data.motivo,
        observacoes: data.observacoes,
      });

      if (!result.success) {
        throw new Error(result.error || 'Não foi possível alterar o status.');
      }

      message.success('Status do eletricista alterado com sucesso!');
      setStatusTarget(null);
      eletricistas.mutate();
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Erro ao alterar status do eletricista.');
      message.error(normalizedError.message);
      throw error;
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleTransferBase = async ({ novaBaseId, motivo }: { novaBaseId: number; motivo?: string }) => {
    if (!transferTarget) {
      return;
    }

    setIsTransferLoading(true);

    try {
      const result = await transferEletricistaBase({
        eletricistaId: transferTarget.id,
        novaBaseId: Number(novaBaseId),
        motivo,
      });

      if (!result.success) {
        throw new Error(result.error || 'Não foi possível transferir a base.');
      }

      message.success('Eletricista transferido com sucesso!');
      setTransferTarget(null);
      eletricistas.mutate();
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Erro ao transferir base do eletricista.');

      message.error(normalizedError.message);
      throw normalizedError;
    } finally {
      setIsTransferLoading(false);
    }
  };

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Tratamento de erro - exibe mensagem se houver problema ao carregar dados
  if (eletricistas.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar eletricistas.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Eletricistas" // Título do card
        extra={canCreate ? (
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setIsLoteModalOpen(true)}>
              Cadastro em Lote
            </Button>
            <Button type="primary" onClick={() => controller.open()}>
              Adicionar
            </Button>
          </Space>
        ) : null}
      >
        {/* Campo de busca por nome e matrícula */}
        <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
          <Input.Search
            placeholder="Buscar por nome ou matrícula..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={(value) =>
              eletricistas.setParams(prev => ({
                ...prev,
                search: value || undefined,
                page: 1
              }))
            }
            style={{ maxWidth: 400 }}
          />
        </Space>

        {/* Filtros externos (server-side) */}
        <TableExternalFilters
          filters={[
            {
              label: 'Base',
              placeholder: 'Filtrar por base',
              options: [
                { label: 'Sem lotação', value: -1 },
                ...(bases.data?.map(base => ({
                  label: base.nome,
                  value: base.id,
                })) || []),
              ],
              onChange: (baseId) =>
                eletricistas.setParams(prev => ({ ...prev, baseId, page: 1 })),
              loading: bases.isLoading,
            },
            {
              label: 'Cargo',
              placeholder: 'Filtrar por cargo',
              options: cargos.data?.map(cargo => ({
                label: cargo.nome,
                value: cargo.id,
              })) || [],
              onChange: (cargoId) =>
                eletricistas.setParams(prev => ({ ...prev, cargoId, page: 1 })),
              loading: cargos.isLoading,
            },
            {
              label: 'Status',
              placeholder: 'Filtrar por status',
              options: Object.entries(StatusEletricistaLabels).map(([value, label]) => ({
                label,
                value,
              })),
              onChange: (status) =>
                eletricistas.setParams(prev => ({ ...prev, status, page: 1 })),
              loading: false,
            },
          ]}
        />

        {/* Tabela principal com dados dos eletricistas */}
        <Table<EletricistaWithBase>
          columns={columns} // Colunas configuradas acima
          dataSource={eletricistas.data} // Dados vindos do useEntityData
          loading={eletricistas.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={eletricistas.pagination} // Configuração de paginação
          onChange={eletricistas.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
        />
      </Card>

      {/* Modal para criação/edição de eletricistas */}
      <Modal
        title={controller.editingItem ? 'Editar Eletricista' : 'Novo Eletricista'} // Título dinâmico
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Função para fechar o modal
        footer={null} // Remove footer padrão (botões OK/Cancel)
        destroyOnHidden // Destrói o conteúdo quando oculto (limpa estado)
        width={600} // Largura do modal
      >
        {/* Formulário dentro do modal */}
        <EletricistaForm
          initialValues={controller.editingItem ? {
            // Se editando, pré-popula com dados do item selecionado
            nome: controller.editingItem.nome,
            matricula: controller.editingItem.matricula,
            telefone: controller.editingItem.telefone,
            estado: controller.editingItem.estado,
            admissao: controller.editingItem.admissao,
            cargoId: controller.editingItem.cargoId,
            contratoId: controller.editingItem.contratoId,
            baseId: controller.editingItem.baseAtual?.id,
          } : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>

      {/* Modal para cadastro em lote */}
      <Modal
        title="Cadastro em Lote de Eletricistas"
        open={isLoteModalOpen}
        onCancel={() => !isLoteLoading && setIsLoteModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={900}
      >
        {isLoteModalOpen && (
          <EletricistaLoteForm
            onSubmit={handleLoteSubmit}
            loading={isLoteLoading}
            contratos={contratos.data || []}
            cargos={cargos.data || []}
            bases={bases.data || []}
          />
        )}
      </Modal>

      <TransferBaseModal
        open={!!transferTarget}
        onClose={closeTransferModal}
        onTransfer={handleTransferBase}
        title={transferTarget ? `Transferir ${transferTarget.nome}` : 'Transferir Base'}
        loading={isTransferLoading}
      />

      <AlterarStatusModal
        open={!!statusTarget}
        onClose={closeStatusModal}
        onAlterarStatus={handleAlterarStatus}
        eletricista={statusTarget || undefined}
        statusAtual={statusTarget?.Status?.status}
        loading={isStatusLoading}
      />

    </>
  );
}
