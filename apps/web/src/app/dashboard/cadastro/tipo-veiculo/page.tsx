'use client';

// Importações das Server Actions específicas do tipo de veículo
import { createTipoVeiculo } from '@/lib/actions/tipoVeiculo/create';
import { deleteTipoVeiculo } from '@/lib/actions/tipoVeiculo/delete';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import { updateTipoVeiculo } from '@/lib/actions/tipoVeiculo/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

// Importações de tipos e utilitários
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma e Ant Design
import { TipoVeiculo } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

// Importação do formulário local
import TipoVeiculoForm, { TipoVeiculoFormData } from './form';

export default function TipoVeiculoPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'tipos-veiculo' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<TipoVeiculo>('tipos-veiculo');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const tiposVeiculo = useEntityData<TipoVeiculo>({
    key: 'tipos-veiculo', // Chave única para o cache SWR
    fetcher: unwrapFetcher(listTiposVeiculo), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
    },
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<TipoVeiculo>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto TipoVeiculo
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
        ...getTextFilter<TipoVeiculo>('nome', 'nome do tipo de veículo'), // Adiciona filtro de busca textual
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
    // Configuração das ações da tabela (botões Editar/Excluir)
    {
      // Ação de edição - abre o modal com o item selecionado
      onEdit: controller.open,

      // Ação de exclusão - executa a Server Action de delete
      onDelete: (item) =>
        controller
          .exec(
            () => deleteTipoVeiculo({ id: item.id }), // Server Action de exclusão
            'Tipo de veículo excluído com sucesso!' // Mensagem de sucesso
          )
          .finally(() => {
            tiposVeiculo.mutate(); // Revalida os dados da tabela após exclusão
          }),
    },
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: TipoVeiculoFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<TipoVeiculo>> => {
      // Verifica se estamos editando (tem item selecionado) ou criando
      const tipoVeiculo = controller.editingItem?.id
        ? await updateTipoVeiculo({
          ...values, // Dados do formulário
          id: controller.editingItem.id, // ID do item sendo editado
        })
        : await createTipoVeiculo(values); // Apenas dados do formulário para criação

      // Retorna o resultado no formato esperado pelo controller
      return { success: true, data: tipoVeiculo.data };
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Tipo de veículo salvo com sucesso!').finally(() => {
      tiposVeiculo.mutate(); // Revalida os dados da tabela após salvar
    });
  };

  // Tratamento de erro - exibe mensagem se houver problema ao carregar dados
  if (tiposVeiculo.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar tipos de veículo.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Tipos de Veículo" // Título do card
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        {/* Tabela principal com dados dos tipos de veículo */}
        <Table<TipoVeiculo>
          columns={columns} // Colunas configuradas acima
          dataSource={tiposVeiculo.data} // Dados vindos do useEntityData
          loading={tiposVeiculo.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={tiposVeiculo.pagination} // Configuração de paginação
          onChange={tiposVeiculo.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
        />
      </Card>

      {/* Modal para criação/edição de tipos de veículo */}
      <Modal
        title={controller.editingItem ? 'Editar Tipo de Veículo' : 'Novo Tipo de Veículo'} // Título dinâmico
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Função para fechar o modal
        footer={null} // Remove footer padrão (botões OK/Cancel)
        destroyOnHidden // Destrói o conteúdo quando oculto (limpa estado)
        width={500} // Largura do modal (menor que contrato pois tem menos campos)
      >
        {/* Formulário dentro do modal */}
        <TipoVeiculoForm
          initialValues={controller.editingItem ? {
            // Se editando, pré-popula com dados do item selecionado
            nome: controller.editingItem.nome,
          } : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>
    </>
  );
}
