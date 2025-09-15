'use client';

// Importações das Server Actions específicas do contrato
import { createContrato } from '@/lib/actions/contrato/create';
import { deleteContrato } from '@/lib/actions/contrato/delete';
import { listContratos } from '@/lib/actions/contrato/list';
import { updateContrato } from '@/lib/actions/contrato/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

// Importações de tipos e utilitários
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma e Ant Design
import { Contrato } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';

// Importação do formulário local
import ContratoForm, { ContratoFormData } from './form';

export default function ContratoPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'contratos' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<Contrato>('contratos');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const contratos = useEntityData<Contrato>({
    key: 'contratos', // Chave única para o cache SWR
    fetcher: unwrapFetcher(listContratos), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
    },
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<Contrato>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto Contrato
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
        ...getTextFilter<Contrato>('nome', 'nome do contrato'), // Adiciona filtro de busca textual
      },
      // Coluna Número - com filtro de texto integrado
      {
        title: 'Número',
        dataIndex: 'numero',
        key: 'numero',
        sorter: true,
        ...getTextFilter<Contrato>('numero', 'número do contrato'), // Filtro para buscar por número
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
            () => deleteContrato({ id: item.id }), // Server Action de exclusão
            'Contrato excluído com sucesso!' // Mensagem de sucesso
          )
          .finally(() => {
            contratos.mutate(); // Revalida os dados da tabela após exclusão
          }),
    },
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: ContratoFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<Contrato>> => {
      // Verifica se estamos editando (tem item selecionado) ou criando
      const contrato = controller.editingItem?.id
        ? await updateContrato({
          ...values, // Dados do formulário
          id: controller.editingItem.id, // ID do item sendo editado
        })
        : await createContrato(values); // Apenas dados do formulário para criação

      // Retorna o resultado no formato esperado pelo controller
      return { success: true, data: contrato.data };
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Contrato salvo com sucesso!').finally(() => {
      contratos.mutate(); // Revalida os dados da tabela após salvar
    });
  };

  // Tratamento de erro - exibe mensagem se houver problema ao carregar dados
  if (contratos.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar contratos.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Contratos" // Título do card
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        {/* Tabela principal com dados dos contratos */}
        <Table<Contrato>
          columns={columns} // Colunas configuradas acima
          dataSource={contratos.data} // Dados vindos do useEntityData
          loading={contratos.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={contratos.pagination} // Configuração de paginação
          onChange={contratos.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
        />
      </Card>

      {/* Modal para criação/edição de contratos */}
      <Modal
        title={controller.editingItem ? 'Editar Contrato' : 'Novo Contrato'} // Título dinâmico
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Função para fechar o modal
        footer={null} // Remove footer padrão (botões OK/Cancel)
        destroyOnHidden // Destrói o conteúdo quando oculto (limpa estado)
        width={600} // Largura do modal
      >
        {/* Formulário dentro do modal */}
        <ContratoForm
          initialValues={controller.editingItem ? {
            // Se editando, pré-popula com dados do item selecionado
            nome: controller.editingItem.nome,
            numero: controller.editingItem.numero,
            dataInicio: controller.editingItem.dataInicio,
            dataFim: controller.editingItem.dataFim,
          } : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>
    </>
  );
}
