'use client';

import { useState } from 'react';

// Importações das Server Actions específicas do veículo
import { createVeiculo } from '@/lib/actions/veiculo/create';
import { deleteVeiculo } from '@/lib/actions/veiculo/delete';
import { listVeiculos } from '@/lib/actions/veiculo/list';
import { transferVeiculoBase } from '@/lib/actions/veiculo/transferBase';
import { updateVeiculo } from '@/lib/actions/veiculo/update';
import {
  canCreateVehicles,
  canDeleteVehicles,
  canUpdateVehicles,
} from '@/lib/authz/registry-access';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

// Importações de tipos e utilitários
import { ActionResult, PaginatedResult } from '@/lib/types/common';
import TransferBaseModal from '@/ui/components/TransferBaseModal';
import { getTextFilter } from '@/ui/components/tableFilters';
import TableExternalFilters from '@/ui/components/TableExternalFilters';

// Importações do Prisma e Ant Design
import { Base, Veiculo } from '@nexa-oper/db';
import { App, Button, Card, Modal, Table, Tag, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';

// Importação dos formulários locais
import VeiculoForm, { VeiculoFormData } from '@/ui/pages/dashboard/cadastro/veiculo/form';
import VeiculoLoteForm from '@/ui/pages/dashboard/cadastro/veiculo/lote-form';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listBases } from '@/lib/actions/base/list';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';

type VeiculoWithBase = Veiculo & { baseAtual?: Base | null };

interface VeiculoPageClientProps {
  initialVeiculos?: PaginatedResult<VeiculoWithBase>;
  initialContratos?: Array<{ id: number; nome: string }>;
  initialBases?: Base[];
  initialTiposVeiculo?: Array<{ id: number; nome: string }>;
}

export default function VeiculoPageClient({
  initialVeiculos,
  initialContratos = [],
  initialBases = [],
  initialTiposVeiculo = [],
}: VeiculoPageClientProps) {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'veiculos' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<VeiculoWithBase>('veiculos');
  const { user } = useAuth({ redirectToLogin: false });
  const { message } = App.useApp();
  const [transferTarget, setTransferTarget] = useState<VeiculoWithBase | null>(null);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];
  const canCreate = canCreateVehicles(userRoles, userPermissions);
  const canUpdate = canUpdateVehicles(userRoles, userPermissions);
  const canDelete = canDeleteVehicles(userRoles, userPermissions);


  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const veiculos = useEntityData<VeiculoWithBase>({
    key: 'veiculos', // Chave única para o cache SWR
    fetcherAction: unwrapPaginatedFetcher(listVeiculos), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialData: initialVeiculos,
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
      // 🚀 INCLUDES DINÂMICOS - Configure quais relacionamentos trazer
      include: {
        tipoVeiculo: true, // Inclui dados do tipo de veículo
        contrato: true,    // Inclui dados do contrato
        // Exemplos de includes aninhados (se necessário):
        // contrato: {
        //   include: {
        //     cliente: true // Incluiria o cliente do contrato também
        //   }
        // }
      },
    },
  });

  // Carregar dados para o formulário em lote
  const { data: contratos } = useEntityData({
    key: 'contratos-lote',
    fetcherAction: unwrapFetcher(listContratosLookup),
    initialData: initialContratos,
    initialParams: { page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' },
    paginationEnabled: false,
  });

  const { data: bases } = useEntityData({
    key: 'bases-lote',
    fetcherAction: unwrapFetcher(listBases),
    initialData: initialBases,
    initialParams: { page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' },
    paginationEnabled: false,
  });

  const { data: tiposVeiculo } = useEntityData({
    key: 'tipos-veiculo-lote',
    fetcherAction: unwrapFetcher(listTiposVeiculo),
    initialData: initialTiposVeiculo,
    initialParams: { page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' },
    paginationEnabled: false,
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<VeiculoWithBase>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto Veiculo
        key: 'id', // Chave única da coluna
        sorter: true, // Habilita ordenação por esta coluna
        width: 80, // Largura fixa da coluna
      },
      // Coluna Placa - com filtro de texto integrado
      {
        title: 'Placa',
        dataIndex: 'placa',
        key: 'placa',
        sorter: true, // Permite ordenação
        ...getTextFilter<VeiculoWithBase>('placa', 'placa do veículo'), // Adiciona filtro de busca textual
        render: (placa: string) => (
          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {placa}
          </Tag>
        ), // Estiliza a placa como tag
        width: 120,
      },
      // Coluna Modelo - com filtro de texto integrado
      {
        title: 'Modelo',
        dataIndex: 'modelo',
        key: 'modelo',
        sorter: true,
        ...getTextFilter<VeiculoWithBase>('modelo', 'modelo do veículo'),
      },
      // Coluna Ano
      {
        title: 'Ano',
        dataIndex: 'ano',
        key: 'ano',
        sorter: true,
        width: 80,
        render: (ano: number) => ano?.toString() || '-',
      },
      // Coluna Tipo de Veículo - relacionamento
      {
        title: 'Tipo',
        dataIndex: ['tipoVeiculo', 'nome'], // Acessa o campo nome do relacionamento tipoVeiculo
        key: 'tipoVeiculo',
        sorter: true,
        render: (nome: string) => nome || '-',
        width: 120,
      },
      // Coluna Contrato - relacionamento
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'], // Acessa o campo nome do relacionamento contrato
        key: 'contrato',
        render: (nome: string, record: Veiculo) => {
          // Mostra nome e número do contrato se disponível
          const contrato = (record as Veiculo & { contrato?: { nome: string; numero: string } }).contrato;
          return contrato ? `${contrato.nome} (${contrato.numero})` : '-';
        },
        width: 200,
      },
      // Coluna Base Atual
      {
        title: 'Base Atual',
        dataIndex: 'baseAtual',
        key: 'baseAtual',
        render: (baseAtual: { nome: string } | null | undefined) => {
          return baseAtual ? (
            <Tag color="green">{baseAtual.nome}</Tag>
          ) : (
            <Tag color="red">Sem lotação</Tag>
          );
        },
        width: 120,
      },
      // Coluna Data de Criação - formatada para exibição
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'), // Formata data para padrão brasileiro
        width: 120,
      },
    ],
    // Configuração das ações da tabela (botões Editar/Excluir/Transferir)
    {
      // Ação de edição - abre o modal com o item selecionado
      onEdit: canUpdate ? controller.open : undefined,

      // Ação de exclusão - executa a Server Action de delete
      onDelete: canDelete
        ? (item) =>
            controller
              .exec(
                () => deleteVeiculo({ id: item.id }), // Server Action de exclusão
                'Veículo excluído com sucesso!' // Mensagem de sucesso
              )
              .finally(() => {
                veiculos.mutate(); // Revalida os dados da tabela após exclusão
              })
        : undefined,

      // Ações customizadas
      customActions: [
        {
          key: 'transfer-base',
          label: 'Transferir Base',
          type: 'link',
          icon: <SwapOutlined />,
          tooltip: 'Transferir veículo para outra base',
          visible: () => canUpdate,
          onClick: (record) => {
            setTransferTarget(record);
          },
        },
      ],
    },
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: VeiculoFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<Veiculo>> => {
      const payload = {
        ...values,
        tipoVeiculoId: Number(values.tipoVeiculoId),
        contratoId: Number(values.contratoId),
        baseId: Number(values.baseId),
      };

      // Verifica se estamos editando (tem item selecionado) ou criando
      const result = controller.editingItem?.id
        ? await updateVeiculo({
          ...payload, // Dados do formulário normalizados
          id: controller.editingItem.id, // ID do item sendo editado
        })
        : await createVeiculo(payload); // Apenas dados do formulário para criação

      // Retorna o resultado original do backend (não sobrescrever success!)
      return result;
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Veículo salvo com sucesso!').finally(() => {
      veiculos.mutate(); // Revalida os dados da tabela após salvar
    });
  };

  const closeTransferModal = () => {
    if (isTransferLoading) {
      return;
    }
    setTransferTarget(null);
  };

  const handleTransferBase = async ({ novaBaseId, motivo }: { novaBaseId: number; motivo?: string }) => {
    if (!transferTarget) {
      return;
    }

    setIsTransferLoading(true);

    try {
      const result = await transferVeiculoBase({
        veiculoId: transferTarget.id,
        novaBaseId: Number(novaBaseId),
        motivo,
      });

      if (!result.success) {
        throw new Error(result.error || 'Não foi possível transferir a base.');
      }

      message.success('Veículo transferido com sucesso!');
      setTransferTarget(null);
      veiculos.mutate();
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error('Erro ao transferir base do veículo.');

      message.error(normalizedError.message);
      throw normalizedError;
    } finally {
      setIsTransferLoading(false);
    }
  };


  // Tratamento de erro - exibe mensagem se houver problema ao carregar dados
  if (veiculos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar veículos.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Veículos" // Título do card
        extra={canCreate ? (
          // Botões no canto superior direito
          <Space>
            <Button onClick={() => setIsLoteModalOpen(true)}>
              Cadastro em Lote
            </Button>
            <Button type="primary" onClick={() => controller.open()}>
              Adicionar
            </Button>
          </Space>
        ) : null}
      >
        {/* Filtros externos (server-side) */}
        <TableExternalFilters
          filters={[
            {
              label: 'Base',
              placeholder: 'Filtrar por base',
              options: [
                { label: 'Sem lotação', value: -1 },
                ...(bases?.map(base => ({
                  label: base.nome,
                  value: base.id,
                })) || []),
              ],
              onChange: (baseId) =>
                veiculos.setParams(prev => ({ ...prev, baseId, page: 1 })),
            },
            {
              label: 'Tipo',
              placeholder: 'Filtrar por tipo',
              options: tiposVeiculo?.map(tipo => ({
                label: tipo.nome,
                value: tipo.id,
              })) || [],
              onChange: (tipoVeiculoId) =>
                veiculos.setParams(prev => ({ ...prev, tipoVeiculoId, page: 1 })),
            },
          ]}
        />

        {/* Tabela principal com dados dos veículos */}
        <Table<VeiculoWithBase>
          columns={columns} // Colunas configuradas acima
          dataSource={veiculos.data} // Dados vindos do useEntityData
          loading={veiculos.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={veiculos.pagination} // Configuração de paginação
          onChange={veiculos.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
          scroll={{ x: 1000 }} // Habilita scroll horizontal se necessário
        />
      </Card>

      {/* Modal para criação/edição de veículos */}
      <Modal
        title={controller.editingItem ? 'Editar Veículo' : 'Novo Veículo'} // Título dinâmico
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Função para fechar o modal
        footer={null} // Remove footer padrão (botões OK/Cancel)
        destroyOnHidden // Destrói o conteúdo quando oculto (limpa estado)
        width={700} // Largura do modal (maior que tipo veículo pois tem mais campos)
      >
        {/* Formulário dentro do modal */}
        <VeiculoForm
          initialValues={controller.editingItem
            ? {
              placa: controller.editingItem.placa,
              modelo: controller.editingItem.modelo,
              ano: controller.editingItem.ano,
              tipoVeiculoId: controller.editingItem.tipoVeiculoId,
              contratoId: controller.editingItem.contratoId,
              baseId: controller.editingItem.baseAtual?.id,
            }
            : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>

      <TransferBaseModal
        open={!!transferTarget}
        onClose={closeTransferModal}
        onTransfer={handleTransferBase}
        title={transferTarget ? `Transferir ${transferTarget.placa}` : 'Transferir Base'}
        loading={isTransferLoading}
      />

      {/* Modal de Cadastro em Lote */}
      <Modal
        title="Cadastro de Veículos em Lote"
        open={isLoteModalOpen}
        onCancel={() => setIsLoteModalOpen(false)}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <VeiculoLoteForm
          contratos={contratos || []}
          bases={bases || []}
          tiposVeiculo={tiposVeiculo || []}
          onSuccess={() => {
            setIsLoteModalOpen(false);
            veiculos.mutate();
          }}
        />
      </Modal>

    </>
  );
}
