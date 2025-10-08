/**
 * Página de Gerenciamento de APR Perguntas
 *
 * Esta página implementa o CRUD completo para perguntas APR,
 * seguindo os padrões de design e arquitetura da aplicação.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada de perguntas APR
 * - Criação de novas perguntas via modal
 * - Edição de perguntas existentes
 * - Exclusão com confirmação
 * - Busca e filtros em tempo real
 * - Ordenação por colunas
 * - Feedback visual de operações
 * - Tratamento de erros padronizado
 *
 * COMPONENTES UTILIZADOS:
 * - useEntityData: Gerenciamento de dados e paginação
 * - useCrudController: Controle de modais e operações
 * - useTableColumnsWithActions: Configuração de tabela
 * - AprPerguntaForm: Formulário de criação/edição
 *
 * ESTRUTURA DA PÁGINA:
 * - Card principal com tabela de perguntas
 * - Modal para formulário de criação/edição
 * - Ações de editar e excluir por linha
 * - Paginação automática
 * - Loading states apropriados
 *
 * EXEMPLO DE FLUXO:
 * 1. Usuário visualiza lista de perguntas
 * 2. Clica em "Adicionar" para criar nova pergunta
 * 3. Preenche formulário e salva
 * 4. Lista é atualizada automaticamente
 * 5. Pode editar ou excluir perguntas existentes
 */

'use client';

import { createAprPergunta } from '@/lib/actions/aprPergunta/create';
import { deleteAprPergunta } from '@/lib/actions/aprPergunta/delete';
import { getAprPergunta } from '@/lib/actions/aprPergunta/get';
import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';
import { updateAprPergunta } from '@/lib/actions/aprPergunta/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprPergunta } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import AprPerguntaForm, { AprPerguntaFormData } from './form';

/**
 * Componente principal da página de APR Perguntas
 *
 * Renderiza a interface completa para gerenciamento de perguntas APR,
 * incluindo listagem, criação, edição e exclusão.
 *
 * @returns JSX.Element - Interface completa da página
 *
 * @example
 * ```typescript
 * // Uso no sistema de rotas do Next.js
 * // Arquivo: app/dashboard/apr-pergunta/page.tsx
 * export default AprPerguntaPage;
 *
 * // Acesso via URL: /dashboard/apr-pergunta
 * ```
 */
export default function AprPerguntaPage() {
  // Controller para gerenciar estado de modais e operações CRUD
  const controller = useCrudController<AprPergunta>('apr-perguntas');

  // Hook para gerenciamento de dados com paginação automática
  const perguntas = useEntityData<AprPergunta>({
    key: 'apr-perguntas',
    fetcher: unwrapFetcher(listAprPerguntas),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  // Configuração das colunas da tabela com ações automáticas
  const columns = useTableColumnsWithActions<AprPergunta>(
    [
      // Coluna ID
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80
      },

      // Coluna principal: Nome da pergunta
      {
        title: 'Pergunta',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprPergunta>('nome', 'pergunta'),
      },

      // Coluna de data de criação
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      // Ação de edição: carrega dados e abre modal
      onEdit: async (item) => {
        const result = await getAprPergunta({ id: item.id });
        if (result.success && result.data) {
          controller.open(result.data);
        }
      },

      // Ação de exclusão: confirma e executa soft delete
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAprPergunta({ id: item.id }),
            'Pergunta excluída com sucesso!'
          )
          .finally(() => perguntas.mutate()),
    }
  );

  /**
   * Handler para submit do formulário
   *
   * Processa tanto criação quanto edição baseado no estado
   * do controller (editingItem presente ou não).
   *
   * @param values - Dados validados do formulário
   */
  const handleSubmit = async (values: AprPerguntaFormData) => {
    const action = async (): Promise<ActionResult<AprPergunta>> => {
      // Determina se é edição ou criação
      const result = controller.editingItem?.id
        ? await updateAprPergunta({ ...values, id: controller.editingItem.id })
        : await createAprPergunta(values);

      return result;
    };

    // Executa ação com feedback automático
    controller
      .exec(action, 'Pergunta salva com sucesso!')
      .finally(() => perguntas.mutate());
  };

  // Loading state para toda a página
  if (perguntas.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar perguntas.</p>;
  }

  return (
    <>
      {/* Card principal com tabela */}
      <Card
        title="Perguntas APR"
        extra={
          <Button
            type="primary"
            onClick={() => controller.open()}
          >
            Adicionar
          </Button>
        }
      >
        <Table<AprPergunta>
          columns={columns}
          dataSource={perguntas.data}
          loading={perguntas.isLoading}
          rowKey="id"
          pagination={perguntas.pagination}
          onChange={perguntas.handleTableChange}
        />
      </Card>

      {/* Modal para formulário de criação/edição */}
      <Modal
        title={controller.editingItem ? 'Editar Pergunta' : 'Nova Pergunta'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <AprPerguntaForm
          initialValues={
            controller.editingItem
              ? { nome: controller.editingItem.nome }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
