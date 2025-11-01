'use client';

// Importações das Server Actions específicas do tipo de equipe
import { createTipoEquipe } from '@/lib/actions/tipoEquipe/create';
import { deleteTipoEquipe } from '@/lib/actions/tipoEquipe/delete';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { updateTipoEquipe } from '@/lib/actions/tipoEquipe/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

// Importações de tipos e utilitários
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma e Ant Design
import { TipoEquipe } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

// Importação do formulário local
import TipoEquipeForm, { TipoEquipeFormData } from './form';

export default function TipoEquipePage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'tipos-equipe' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<TipoEquipe>('tipos-equipe');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const tiposEquipe = useEntityData<TipoEquipe>({
    key: 'tipos-equipe', // Chave única para o cache SWR
    fetcherAction: unwrapFetcher(listTiposEquipe), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
    },
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<TipoEquipe>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto TipoEquipe
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
        ...getTextFilter<TipoEquipe>('nome', 'nome do tipo de equipe'), // Adiciona filtro de busca textual
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
            () => deleteTipoEquipe({ id: item.id }), // Server Action de exclusão
            'Tipo de equipe excluído com sucesso!' // Mensagem de sucesso
          )
          .finally(() => {
            tiposEquipe.mutate(); // Revalida os dados da tabela após exclusão
          }),
    }
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: TipoEquipeFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<TipoEquipe>> => {
      // Verifica se estamos editando (tem item selecionado) ou criando
      const result = controller.editingItem?.id
        ? await updateTipoEquipe({
            ...values, // Dados do formulário
            id: controller.editingItem.id, // ID do item sendo editado
          })
        : await createTipoEquipe(values); // Apenas dados do formulário para criação

      // Retorna o resultado original do backend (não sobrescrever success!)
      return result;
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Tipo de equipe salvo com sucesso!').finally(() => {
      tiposEquipe.mutate(); // Revalida os dados da tabela após salvar
    });
  };

  // Tratamento de erro - exibe mensagem se houver problema ao carregar dados
  if (tiposEquipe.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar tipos de equipe.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Tipos de Equipe" // Título do card
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        {/* Tabela principal com dados dos tipos de equipe */}
        <Table<TipoEquipe>
          columns={columns} // Colunas configuradas acima
          dataSource={tiposEquipe.data} // Dados vindos do useEntityData
          loading={tiposEquipe.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={tiposEquipe.pagination} // Configuração de paginação
          onChange={tiposEquipe.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
        />
      </Card>

      {/* Modal para criação/edição de tipos de equipe */}
      <Modal
        title={controller.editingItem ? 'Editar Tipo de Equipe' : 'Novo Tipo de Equipe'} // Título dinâmico
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Função para fechar o modal
        footer={null} // Remove footer padrão (botões OK/Cancel)
        destroyOnHidden // Destrói o conteúdo quando oculto (limpa estado)
        width={500} // Largura do modal (semelhante ao de tipo de veículo)
      >
        {/* Formulário dentro do modal */}
        <TipoEquipeForm
          initialValues={
            controller.editingItem
              ? {
                  // Se editando, pré-popula com dados do item selecionado
                  nome: controller.editingItem.nome,
                }
              : undefined
          } // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>
    </>
  );
}

