/**
 * Página de Gerenciamento de APRs (Análise Preliminar de Risco)
 *
 * Esta página implementa o CRUD completo para APRs,
 * seguindo os padrões de design e arquitetura da aplicação.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada de APRs
 * - Criação de novas APRs via modal
 * - Edição de APRs existentes
 * - Exclusão com confirmação
 * - Busca e filtros em tempo real
 * - Ordenação por colunas
 * - Feedback visual de operações
 * - Tratamento de erros padronizado
 * - Exibição de contadores de relacionamentos
 * - Transfer components para vinculação
 *
 * COMPONENTES UTILIZADOS:
 * - useEntityData: Gerenciamento de dados e paginação
 * - useCrudController: Controle de modais e operações
 * - useTableColumnsWithActions: Configuração de tabela
 * - AprForm: Formulário com Transfer components
 *
 * ESTRUTURA DA PÁGINA:
 * - Card principal com tabela de APRs
 * - Modal para formulário de criação/edição
 * - Ações de editar e excluir por linha
 * - Colunas com contadores de relacionamentos
 * - Paginação automática
 * - Loading states apropriados
 *
 * EXEMPLO DE FLUXO:
 * 1. Usuário visualiza lista de APRs
 * 2. Clica em "Adicionar" para criar nova APR
 * 3. Preenche formulário (nome, perguntas, opções)
 * 4. Transfer components permitem seleção múltipla
 * 5. Lista é atualizada automaticamente
 * 6. Pode editar ou excluir APRs existentes
 */

'use client';

import { createApr } from '@/lib/actions/apr/create';
import { deleteApr } from '@/lib/actions/apr/delete';
import { getApr } from '@/lib/actions/apr/get';
import { listAprs } from '@/lib/actions/apr/list';
import { updateApr } from '@/lib/actions/apr/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Apr } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Tag } from 'antd';
import AprForm, { AprFormData } from './form';

/**
 * Componente principal da página de APRs
 *
 * Renderiza a interface completa para gerenciamento de APRs,
 * incluindo listagem, criação, edição e exclusão com
 * Transfer components para vinculação de relacionamentos.
 *
 * @returns JSX.Element - Interface completa da página
 *
 * @example
 * ```typescript
 * // Uso no sistema de rotas do Next.js
 * // Arquivo: app/dashboard/apr-modelo/page.tsx
 * export default AprPage;
 * 
 * // Acesso via URL: /dashboard/apr-modelo
 * ```
 */
export default function AprPage() {
  // Controller para gerenciar estado de modais e operações CRUD
  const controller = useCrudController<Apr>('aprs');

  // Hook para gerenciamento de dados com paginação automática
  const aprs = useEntityData<Apr>({
    key: 'aprs',
    fetcher: unwrapFetcher(listAprs),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        AprPerguntaRelacao: true,
        AprOpcaoRespostaRelacao: true,
      },
    },
  });

  // Configuração das colunas da tabela com ações automáticas
  const columns = useTableColumnsWithActions<Apr>(
    [
      // Coluna ID
      { 
        title: 'ID', 
        dataIndex: 'id', 
        key: 'id', 
        sorter: true, 
        width: 80 
      },
      
      // Coluna principal: Nome da APR
      {
        title: 'Nome da APR',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Apr>('nome', 'APR'),
      },
      
      // Coluna: Quantidade de Perguntas vinculadas
      {
        title: 'Perguntas',
        key: 'perguntas',
        width: 100,
        align: 'center' as const,
        render: (_, record: any) => {
          const count = record.AprPerguntaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'blue' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: any, b: any) => {
          const countA = a.AprPerguntaRelacao?.length || 0;
          const countB = b.AprPerguntaRelacao?.length || 0;
          return countA - countB;
        },
      },
      
      // Coluna: Quantidade de Opções de Resposta vinculadas
      {
        title: 'Opções de Resposta',
        key: 'opcoes',
        width: 140,
        align: 'center' as const,
        render: (_, record: any) => {
          const count = record.AprOpcaoRespostaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'green' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: any, b: any) => {
          const countA = a.AprOpcaoRespostaRelacao?.length || 0;
          const countB = b.AprOpcaoRespostaRelacao?.length || 0;
          return countA - countB;
        },
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
        const result = await getApr({ id: item.id });
        if (result.success && result.data) {
          controller.open(result.data);
        }
      },
      
      // Ação de exclusão: confirma e executa soft delete
      onDelete: (item) =>
        controller
          .exec(
            () => deleteApr({ id: item.id }), 
            'APR excluída com sucesso!'
          )
          .finally(() => aprs.mutate()),
    }
  );

  /**
   * Handler para submit do formulário
   *
   * Processa tanto criação quanto edição baseado no estado
   * do controller (editingItem presente ou não).
   * Gerencia automaticamente os relacionamentos via Transfer components.
   *
   * @param values - Dados validados do formulário incluindo arrays de IDs
   */
  const handleSubmit = async (values: AprFormData) => {
    const action = async (): Promise<ActionResult<Apr>> => {
      // Determina se é edição ou criação
      const apr = controller.editingItem?.id
        ? await updateApr({ ...values, id: controller.editingItem.id })
        : await createApr(values);
        
      return { success: true, data: apr.data };
    };
    
    // Executa ação com feedback automático
    controller
      .exec(action, 'APR salva com sucesso!')
      .finally(() => aprs.mutate());
  };

  // Loading state para toda a página
  if (aprs.error) {
    return <p style={{ color: 'red' }}>Erro ao carregar APRs.</p>;
  }

  return (
    <>
      {/* Card principal com tabela */}
      <Card
        title="APRs (Análise Preliminar de Risco)"
        extra={
          <Button 
            type="primary" 
            onClick={() => controller.open()}
          >
            Adicionar APR
          </Button>
        }
      >
        <Table<Apr>
          columns={columns}
          dataSource={aprs.data}
          loading={aprs.isLoading}
          rowKey="id"
          pagination={aprs.pagination}
          onChange={aprs.handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal para formulário de criação/edição */}
      <Modal
        title={controller.editingItem ? 'Editar APR' : 'Nova APR'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={800}
        style={{ top: 20 }}
      >
        <AprForm
          initialValues={
            controller.editingItem 
              ? { 
                  id: controller.editingItem.id,
                  nome: controller.editingItem.nome,
                  // Os relacionamentos são carregados automaticamente pelo form
                  perguntaIds: [],
                  opcaoRespostaIds: []
                } 
              : undefined
          }
          onSubmit={handleSubmit}
          loading={controller.loading}
        />
      </Modal>
    </>
  );
}
