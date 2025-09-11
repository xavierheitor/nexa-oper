'use client';

// Importações do Ant Design e React

// Importações das Server Actions para buscar dados dos selects
import { listEletricistas } from '@/lib/actions/eletricista/list';

// Tipos do Prisma
import { Eletricista } from '@nexa-oper/db';

// Importações do Prisma

// Importações do hook e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { Button, Card, Modal, Table } from 'antd';
import { createEletricista } from '../../../lib/actions/eletricista/create';
import { deleteEletricista } from '../../../lib/actions/eletricista/delete';
import { updateEletricista } from '../../../lib/actions/eletricista/update';
import { ActionResult } from '../../../lib/types/common';
import { getSelectFilter, getTextFilter } from '../../../ui/components/tableFilters';
import EletricistaForm, { EletricistaFormData } from './form';

export default function EletricistaPage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'eletricistas' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<Eletricista>('eletricistas');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const eletricistas = useEntityData<Eletricista>({
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
  const columns = useTableColumnsWithActions<Eletricista>(
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
    },
  );

  // Função que processa o submit do formulário (tanto criação quanto edição)
  const handleSubmit = async (values: EletricistaFormData) => {
    // Cria uma ação assíncrona que será executada pelo controller
    const action = async (): Promise<ActionResult<Eletricista>> => {
      // Verifica se estamos editando (tem item selecionado) ou criando
      const eletricista = controller.editingItem?.id
        ? await updateEletricista({
          ...values, // Dados do formulário
          id: controller.editingItem.id,
        })
        : await createEletricista(values); // Apenas dados do formulário para criação

      // Retorna o resultado no formato esperado pelo controller
      return { success: true, data: eletricista.data };
    };

    // Executa a ação através do controller (gerencia loading, notificações, etc.)
    controller.exec(action, 'Eletricista salvo com sucesso!').finally(() => {
      eletricistas.mutate(); // Revalida os dados da tabela após salvar
    });
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
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        {/* Tabela principal com dados dos eletricistas */}
        <Table<Eletricista>
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
        destroyOnHidden // Destrói o conteúdo quando fechado (limpa estado)
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
          } : undefined} // Se criando, deixa campos vazios
          onSubmit={handleSubmit} // Função que processa o submit
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>
    </>
  );
}