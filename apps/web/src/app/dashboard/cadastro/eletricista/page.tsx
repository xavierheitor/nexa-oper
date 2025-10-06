'use client';

import { useState } from 'react';

// Importações das Server Actions para buscar dados dos selects
import { listEletricistas } from '@/lib/actions/eletricista/list';

// Tipos do Prisma
import { Base, Eletricista } from '@nexa-oper/db';

// Importações do hook e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { App, Button, Card, Modal, Table, Tag } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { createEletricista } from '../../../../lib/actions/eletricista/create';
import { deleteEletricista } from '../../../../lib/actions/eletricista/delete';
import { transferEletricistaBase } from '../../../../lib/actions/eletricista/transferBase';
import { updateEletricista } from '../../../../lib/actions/eletricista/update';
import { ActionResult } from '../../../../lib/types/common';
import TransferBaseModal from '../../../../ui/components/TransferBaseModal';
import { getSelectFilter, getTextFilter } from '../../../../ui/components/tableFilters';
import EletricistaForm, { EletricistaFormData } from './form';

type EletricistaWithBase = Eletricista & { baseAtual?: Base | null };

export default function EletricistaPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'eletricistas' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<EletricistaWithBase>('eletricistas');
  // Hook para gerenciar mensagens
  const { message } = App.useApp();
  // Estado para controlar a transferência de base
  const [transferTarget, setTransferTarget] = useState<EletricistaWithBase | null>(null);
  // Estado para controlar o loading da transferência de base
  const [isTransferLoading, setIsTransferLoading] = useState(false);


  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const eletricistas = useEntityData<EletricistaWithBase>({
    key: 'eletricistas', // Chave única para o cache SWR
    fetcher: unwrapFetcher(listEletricistas), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
      include: {
        contrato: true, // Inclui dados do contrato
      },
    },
  });


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
      {
        title: 'Telefone',
        dataIndex: 'telefone',
        key: 'telefone',
        sorter: true, // Permite ordenação
        ...getTextFilter<Eletricista>('telefone', 'telefone do eletricista'), // Adiciona filtro de busca textual
      },
      // Coluna Estado - com filtro de seleção
      {
        title: 'Estado',
        dataIndex: 'estado',
        key: 'estado',
        sorter: true, // Permite ordenação
        ...getSelectFilter<Eletricista>('estado', [
          { text: 'Ativo', value: 'ativo' },
          { text: 'Inativo', value: 'inativo' }
        ]), // Adiciona filtro de seleção
      },
      // Coluna Base Atual
      {
        title: 'Base Atual',
        dataIndex: 'baseAtual',
        key: 'baseAtual',
        render: (baseAtual: any) => {
          return baseAtual ? (
            <Tag color="green">{baseAtual.nome}</Tag>
          ) : (
            <Tag color="red">Sem lotação</Tag>
          );
        },
        width: 120,
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteEletricista({ id: item.id }), // Server Action de exclusão
            'Eletricista excluído com sucesso!' // Mensagem de sucesso
          )
          .finally(() => {
            eletricistas.mutate(); // Revalida os dados da tabela após exclusão
          }),

      // Ações customizadas
      customActions: [
        {
          key: 'transfer-base',
          label: 'Transferir Base',
          type: 'link',
          icon: <SwapOutlined />,
          tooltip: 'Transferir eletricista para outra base',
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
      };

      // Verifica se estamos editando (tem item selecionado) ou criando
      const eletricista = controller.editingItem?.id
        ? await updateEletricista({
          ...payload, // Dados do formulário normalizados
          id: controller.editingItem.id,
        })
        : await createEletricista(payload); // Apenas dados do formulário para criação

      // Retorna o resultado no formato esperado pelo controller
      return { success: true, data: eletricista.data };
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Eletricista salvo com sucesso!').finally(() => {
      eletricistas.mutate(); // Revalida os dados da tabela após salvar
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
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
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
            contratoId: controller.editingItem.contratoId,
            baseId: controller.editingItem.baseAtual?.id,
          } : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>

      <TransferBaseModal
        open={!!transferTarget}
        onClose={closeTransferModal}
        onTransfer={handleTransferBase}
        title={transferTarget ? `Transferir ${transferTarget.nome}` : 'Transferir Base'}
        loading={isTransferLoading}
      />

    </>
  );
}
