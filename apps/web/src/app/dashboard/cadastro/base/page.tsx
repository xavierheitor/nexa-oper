'use client';

// Importações das Server Actions específicas da base
import { createBase } from '@/lib/actions/base/create';
import { deleteBase } from '@/lib/actions/base/delete';
import { listBases } from '@/lib/actions/base/list';
import { updateBase } from '@/lib/actions/base/update';

// Importações dos hooks e utilitários da aplicação
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';

// Importações de tipos e utilitários
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';

// Importações do Prisma e Ant Design
import { Base } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import BaseForm, { BaseFormData } from './form';

// Importação do formulário local


export default function BasePage() {
  // Hook para controlar operações CRUD (modal, loading, execução de ações)
  // O parâmetro 'bases' é a chave usada para revalidar o cache SWR
  const controller = useCrudController<Base>('bases');

  // Hook para gerenciar dados da tabela com paginação, ordenação e filtros
  const bases = useEntityData<Base>({
    key: 'bases', // Chave única para o cache SWR
    fetcherAction: unwrapFetcher(listBases), // Função que busca os dados (Server Action)
    paginationEnabled: true, // Habilita paginação
    initialParams: {
      page: 1, // Página inicial
      pageSize: 10, // Itens por página
      orderBy: 'id', // Campo para ordenação inicial
      orderDir: 'desc', // Direção da ordenação (mais recentes primeiro)
      include: { contrato: true }, // Inclui dados do contrato
    },
  });

  // Configuração das colunas da tabela com ações integradas
  const columns = useTableColumnsWithActions<Base>(
    [
      // Coluna ID - simples, apenas para referência
      {
        title: 'ID',
        dataIndex: 'id', // Campo do objeto Base
        key: 'id', // Chave única da coluna
        sorter: true, // Permite ordenação
        width: 80, // Largura fixa para IDs
      },
      // Coluna Nome - com filtro de texto
      {
        title: 'Nome',
        dataIndex: 'nome', // Campo do objeto Base
        key: 'nome', // Chave única da coluna
        sorter: true, // Permite ordenação
        ...getTextFilter<Base>('nome', 'nome'), // Filtro de texto integrado
      },
      // Coluna Contrato ID - exibe ID do contrato
      {
        title: 'Contrato ID',
        dataIndex: 'contratoId', // Campo do objeto Base
        key: 'contratoId', // Chave única da coluna
        sorter: true, // Permite ordenação
        width: 120, // Largura fixa
      },
    ],
    {
      // Configuração das ações da tabela
      onEdit: controller.open, // Abre modal para edição
      onDelete: (item) => controller
        .exec(() => deleteBase({ id: item.id }), 'Base excluída com sucesso!') // Executa exclusão
        .finally(() => bases.mutate()), // Revalida dados após exclusão
    }
  );

  // Função para lidar com o envio do formulário (criação e edição)
  const handleSubmit = async (values: BaseFormData) => {
    // Função assíncrona que será executada pelo controller
    const action = async () => {
      // Se está editando (tem ID), atualiza; senão, cria novo
      const result = controller.editingItem?.id
        ? await updateBase({ ...values, id: controller.editingItem.id }) // Atualização
        : await createBase(values); // Criação

      // Retorna resultado original do backend (não sobrescrever success!)
      return result;
    };

    // Executa a ação com feedback para o usuário
    controller
      .exec(action, 'Base salva com sucesso!') // Executa com mensagem de sucesso
      .finally(() => bases.mutate()); // Revalida dados após operação
  };

  // Se há erro no carregamento, exibe mensagem de erro
  if (bases.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar bases.</p>;
  }

  // Renderização do componente
  return (
    <>
      {/* Card principal que contém a tabela */}
      <Card
        title="Bases" // Título do card
        extra={
          // Botão "Adicionar" no canto superior direito
          <Button type="primary" onClick={() => controller.open()}>
            Adicionar
          </Button>
        }
      >
        {/* Tabela principal com dados das bases */}
        <Table<Base>
          columns={columns} // Colunas configuradas acima
          dataSource={bases.data} // Dados vindos do useEntityData
          loading={bases.isLoading} // Estado de loading
          rowKey="id" // Campo único para identificar cada linha
          pagination={bases.pagination} // Configuração de paginação
          onChange={bases.handleTableChange} // Handler para mudanças (paginação, filtros, ordenação)
        />
      </Card>

      {/* Modal para criação/edição de bases */}
      <Modal
        title={controller.editingItem ? 'Editar Base' : 'Nova Base'} // Título dinâmico baseado no modo
        open={controller.isOpen} // Controla se o modal está aberto
        onCancel={controller.close} // Fecha o modal ao cancelar
        footer={null} // Remove footer padrão (botões ficam no formulário)
        destroyOnHidden // Destrói o modal ao fechar (limpa estado)
        width={600} // Largura do modal
      >
        {/* Formulário de criação/edição */}
        <BaseForm
          initialValues={
            // Se está editando, passa os valores atuais; senão, undefined
            controller.editingItem
              ? {
                  nome: controller.editingItem.nome,
                  contratoId: controller.editingItem.contratoId,
                }
              : undefined
          }
          onSubmit={handleSubmit} // Função chamada ao submeter o formulário
          loading={controller.loading} // Estado de loading para desabilitar botões
        />
      </Modal>
    </>
  );
}
