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
import { deleteAprTipoAtividadeVinculo } from '@/lib/actions/aprVinculo/tipoAtividade/delete';
import { listAprTipoAtividadeVinculos } from '@/lib/actions/aprVinculo/tipoAtividade/list';
import { setAprTipoAtividade } from '@/lib/actions/aprVinculo/tipoAtividade/set';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Apr, AprTipoAtividadeRelacao } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Button, Card, Form, Modal, Select, Spin, Table, Tag, App, message } from 'antd';
import { useState } from 'react';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
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
  const { message } = App.useApp();
  // Controller para gerenciar estado de modais e operações CRUD
  const controller = useCrudController<Apr>('aprs');

  // Controller para gerenciar vínculos APR-TipoAtividade
  const taController = useCrudController<AprTipoAtividadeRelacao>('apr-ta-vinculos');

  // Hook para gerenciamento de dados com paginação automática
  const aprs = useEntityData<Apr>({
    key: 'aprs',
    fetcherAction: unwrapFetcher(listAprs),
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

  // Hook para gerenciamento de vínculos APR-TipoAtividade
  const taVinculos = useEntityData<AprTipoAtividadeRelacao>({
    key: 'apr-ta-vinculos',
    fetcherAction: unwrapFetcher(listAprTipoAtividadeVinculos),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        apr: true,
        tipoAtividade: true,
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
        render: (_, record: Apr & { AprPerguntaRelacao?: unknown[] }) => {
          const count = record.AprPerguntaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'blue' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: Apr & { AprPerguntaRelacao?: unknown[] }, b: Apr & { AprPerguntaRelacao?: unknown[] }) => {
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
        render: (_, record: Apr & { AprOpcaoRespostaRelacao?: unknown[] }) => {
          const count = record.AprOpcaoRespostaRelacao?.length || 0;
          return (
            <Tag color={count > 0 ? 'green' : 'default'}>
              {count}
            </Tag>
          );
        },
        sorter: (a: Apr & { AprOpcaoRespostaRelacao?: unknown[] }, b: Apr & { AprOpcaoRespostaRelacao?: unknown[] }) => {
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

  // Configuração das colunas da tabela de vínculos APR-TipoAtividade
  const taColumns = useTableColumnsWithActions<AprTipoAtividadeRelacao>(
    [
      // Coluna ID
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80
      },

      // Coluna: Tipo de Atividade
      {
        title: 'Tipo de Atividade',
        dataIndex: ['tipoAtividade', 'nome'],
        key: 'tipoAtividade',
        sorter: true,
      },

      // Coluna: APR vinculada
      {
        title: 'APR Vinculada',
        dataIndex: ['apr', 'nome'],
        key: 'apr',
        sorter: true,
      },

      // Coluna de data de criação
      {
        title: 'Vinculado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      // Ação de exclusão: confirma e remove vínculo
      onDelete: (item) =>
        taController
          .exec(
            () => deleteAprTipoAtividadeVinculo({ id: item.id }),
            'Vínculo removido com sucesso!'
          )
          .finally(() => taVinculos.mutate()),
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
      const result = controller.editingItem?.id
        ? await updateApr({ ...values, id: controller.editingItem.id })
        : await createApr(values);

      return result;
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

      {/* Card de vínculos APR-TipoAtividade */}
      <Card
        title="Vínculos APR - Tipo de Atividade"
        style={{ marginTop: 16 }}
        extra={
          <Button
            type="primary"
            onClick={() => taController.open()}
          >
            Adicionar Vínculo
          </Button>
        }
      >
        <Table
          columns={taColumns}
          dataSource={taVinculos.data}
          loading={taVinculos.isLoading}
          rowKey="id"
          pagination={taVinculos.pagination}
          onChange={taVinculos.handleTableChange}
          scroll={{ x: 600 }}
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

      {/* Modal para criação de vínculo APR-TipoAtividade */}
      <Modal
        title="Novo Vínculo APR - Tipo de Atividade"
        open={taController.isOpen}
        onCancel={taController.close}
        footer={null}
        destroyOnHidden
        width={500}
      >
        {taController.isOpen && <VinculoTAModal
          onSaved={() => {
            taController.close();
            taVinculos.mutate();
          }}
          controllerExec={taController.exec}
        />
      </Modal>
    </>
  );
}

/**
 * Componente Modal para Vinculação APR-TipoAtividade
 *
 * Modal específico para criar vínculos entre APRs e Tipos de Atividade.
 * Carrega dados necessários (APRs e Tipos de Atividade) e permite
 * seleção via dropdowns com busca.
 *
 * FUNCIONALIDADES:
 * - Carregamento automático de APRs e Tipos de Atividade
 * - Dropdowns com busca e filtros
 * - Validação de campos obrigatórios
 * - Feedback de loading durante operações
 * - Integração com Server Actions
 * - Callback de sucesso para atualização de lista
 *
 * @param onSaved - Callback executado após salvar com sucesso
 * @param controllerExec - Função do controller para executar ações
 */
function VinculoTAModal({
  onSaved,
  controllerExec
}: {
  onSaved: () => void;
  controllerExec: CrudController<unknown>['exec']
}) {
  // Estado local do formulário
  const [form] = Form.useForm();

  /**
   * Carrega dados necessários para os dropdowns
   *
   * Executa chamadas paralelas para buscar APRs e Tipos de Atividade
   * disponíveis para vinculação. Trata erros e gerencia estado de loading.
   */
  const { data: dadosVinculo, loading } = useDataFetch(
    async () => {
      // Busca paralela de APRs e Tipos de Atividade
      const [aprsResult, tiposResult] = await Promise.all([
        listAprs({
          page: 1,
          pageSize: 200,
          orderBy: 'nome',
          orderDir: 'asc'
        }),
        listTiposAtividade({
          page: 1,
          pageSize: 200,
          orderBy: 'nome',
          orderDir: 'asc'
        }),
      ]);

      if (aprsResult.success && aprsResult.data && tiposResult.success && tiposResult.data) {
        return {
          aprs: aprsResult.data.data || [],
          tipos: tiposResult.data.data || [],
        };
      }
      throw new Error('Erro ao carregar dados para vinculação');
    },
    [],
    {
      onError: () => {
        message.error('Erro ao carregar dados para vinculação');
      }
    }
  );

  const tipos = dadosVinculo?.tipos || [];
  const aprsData = dadosVinculo?.aprs || [];

  // Exibe loading enquanto carrega dados
  if (loading) {
    return <Spin spinning style={{ width: '100%', padding: '40px 0' }} />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values: { aprId: number; tipoAtividadeId: number }) =>
        controllerExec(
          () => setAprTipoAtividade(values),
          'Vínculo salvo com sucesso!'
        ).finally(onSaved)
      }
    >
      {/* Seleção de Tipo de Atividade */}
      <Form.Item
        name="tipoAtividadeId"
        label="Tipo de Atividade"
        rules={[{ required: true, message: 'Selecione um tipo de atividade' }]}
      >
        <Select
          showSearch
          placeholder="Selecione o tipo de atividade"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={tipos.map(tipo => ({
            value: tipo.id,
            label: tipo.nome
          }))}
        />
      </Form.Item>

      {/* Seleção de APR */}
      <Form.Item
        name="aprId"
        label="APR"
        rules={[{ required: true, message: 'Selecione uma APR' }]}
      >
        <Select
          showSearch
          placeholder="Selecione a APR"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={aprsData.map(apr => ({
            value: apr.id,
            label: apr.nome
          }))}
        />
      </Form.Item>

      {/* Botão de submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Salvar Vínculo
        </Button>
      </Form.Item>
    </Form>
  );
}
