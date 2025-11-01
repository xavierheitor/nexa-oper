/**
 * Página de Gerenciamento de APR Opções de Resposta
 *
 * Esta página implementa o CRUD completo para opções de resposta APR,
 * seguindo os padrões de design e arquitetura da aplicação.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada de opções de resposta APR
 * - Criação de novas opções de resposta via modal
 * - Edição de opções de resposta existentes
 * - Exclusão com confirmação
 * - Busca e filtros em tempo real
 * - Ordenação por colunas
 * - Feedback visual de operações
 * - Tratamento de erros padronizado
 * - Exibição de status "Gera Pendência"
 *
 * COMPONENTES UTILIZADOS:
 * - useEntityData: Gerenciamento de dados e paginação
 * - useCrudController: Controle de modais e operações
 * - useTableColumnsWithActions: Configuração de tabela
 * - AprOpcaoRespostaForm: Formulário de criação/edição
 *
 * ESTRUTURA DA PÁGINA:
 * - Card principal com tabela de opções de resposta
 * - Modal para formulário de criação/edição
 * - Ações de editar e excluir por linha
 * - Coluna especial para "Gera Pendência"
 * - Paginação automática
 * - Loading states apropriados
 *
 * EXEMPLO DE FLUXO:
 * 1. Usuário visualiza lista de opções de resposta
 * 2. Clica em "Adicionar" para criar nova opção
 * 3. Preenche formulário (nome e gera pendência)
 * 4. Lista é atualizada automaticamente
 * 5. Pode editar ou excluir opções existentes
 */

'use client';

import { createAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/create';
import { deleteAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/delete';
import { getAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/get';
import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import { updateAprOpcaoResposta } from '@/lib/actions/aprOpcaoResposta/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { AprOpcaoResposta } from '@nexa-oper/db';
import { Button, Card, Modal, Table } from 'antd';
import AprOpcaoRespostaForm, { AprOpcaoRespostaFormData } from './form';

/**
 * Componente principal da página de APR Opções de Resposta
 *
 * Renderiza a interface completa para gerenciamento de opções de resposta APR,
 * incluindo listagem, criação, edição e exclusão.
 *
 * @returns JSX.Element - Interface completa da página
 *
 * @example
 * ```typescript
 * // Uso no sistema de rotas do Next.js
 * // Arquivo: app/dashboard/apr-opcao-resposta/page.tsx
 * export default AprOpcaoRespostaPage;
 *
 * // Acesso via URL: /dashboard/apr-opcao-resposta
 * ```
 */
export default function AprOpcaoRespostaPage() {
  // Controller para gerenciar estado de modais e operações CRUD
  const controller = useCrudController<AprOpcaoResposta>('apr-opcoes-resposta');

  // Hook para gerenciamento de dados com paginação automática
  const opcoesResposta = useEntityData<AprOpcaoResposta>({
    key: 'apr-opcoes-resposta',
    fetcherAction: unwrapFetcher(listAprOpcoesResposta),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  });

  // Configuração das colunas da tabela com ações automáticas
  const columns = useTableColumnsWithActions<AprOpcaoResposta>(
    [
      // Coluna ID
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80
      },

      // Coluna principal: Nome da opção de resposta
      {
        title: 'Opção de Resposta',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<AprOpcaoResposta>('nome', 'opção de resposta'),
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
        const result = await getAprOpcaoResposta({ id: item.id });
        if (result.success && result.data) {
          controller.open(result.data);
        }
      },

      // Ação de exclusão: confirma e executa soft delete
      onDelete: (item) =>
        controller
          .exec(
            () => deleteAprOpcaoResposta({ id: item.id }),
            'Opção de resposta excluída com sucesso!'
          )
          .finally(() => opcoesResposta.mutate()),
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
  const handleSubmit = async (values: AprOpcaoRespostaFormData) => {
    const action = async (): Promise<ActionResult<AprOpcaoResposta>> => {
      // Determina se é edição ou criação
      const result = controller.editingItem?.id
        ? await updateAprOpcaoResposta({ ...values, id: controller.editingItem.id })
        : await createAprOpcaoResposta(values);

      return result;
    };

    // Executa ação com feedback automático
    controller
      .exec(action, 'Opção de resposta salva com sucesso!')
      .finally(() => opcoesResposta.mutate());
  };

  // Loading state para toda a página
  if (opcoesResposta.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar opções de resposta.</p>;
  }

  return (
    <>
      {/* Card principal com tabela */}
      <Card
        title="Opções de Resposta APR"
        extra={
          <Button
            type="primary"
            onClick={() => controller.open()}
          >
            Adicionar
          </Button>
        }
      >
        <Table<AprOpcaoResposta>
          columns={columns}
          dataSource={opcoesResposta.data}
          loading={opcoesResposta.isLoading}
          rowKey="id"
          pagination={opcoesResposta.pagination}
          onChange={opcoesResposta.handleTableChange}
        />
      </Card>

      {/* Modal para formulário de criação/edição */}
      <Modal
        title={controller.editingItem ? 'Editar Opção de Resposta' : 'Nova Opção de Resposta'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <AprOpcaoRespostaForm
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
