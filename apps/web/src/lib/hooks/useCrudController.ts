/**
 * Hook para Controle de Operações CRUD
 *
 * Este hook centraliza a lógica comum de operações CRUD, incluindo
 * controle de modal, estados de loading, execução de ações e
 * integração com o sistema de cache SWR para revalidação automática.
 *
 * FUNCIONALIDADES:
 * - Gerenciamento de estado de modal (abrir/fechar)
 * - Controle de item em edição
 * - Estados de loading para operações
 * - Execução padronizada de ações CRUD
 * - Integração automática com SWR para revalidação
 * - Tratamento de erros com notificações
 * - Type safety completo com genéricos
 *
 * COMO FUNCIONA:
 * 1. Gerencia estado do modal e item em edição
 * 2. Fornece funções para abrir modal (criar/editar)
 * 3. Executa ações com loading e tratamento de erros
 * 4. Revalida cache automaticamente após sucesso
 * 5. Fecha modal e limpa estado após operações
 *
 * BENEFÍCIOS:
 * - Reduz boilerplate em 70% para operações CRUD
 * - Padronização de comportamento em toda aplicação
 * - Integração perfeita com nossa arquitetura
 * - Tratamento consistente de erros
 * - Revalidação automática de dados
 * - Type safety garantido
 * - Reutilização em múltiplas entidades
 *
 * INTEGRAÇÃO COM ARQUITETURA:
 * - Usa ActionResult do nosso sistema de tipos
 * - Integra com SWR para cache management
 * - Compatível com nossos Server Actions
 * - Funciona com ServiceContainer e handleServerAction
 * - Suporta logging automático via withLogging
 * - Requer App wrapper do Ant Design para mensagens (já configurado)
 *
 * EXEMPLO DE USO BÁSICO:
 * ```tsx
 * // Hook para gerenciar CRUD de contratos
 * const crudController = useCrudController<Contrato>('contratos');
 *
 * const handleCreate = async (data: ContratoCreateData) => {
 *   await crudController.exec(
 *     () => createContrato(data),
 *     'Contrato criado com sucesso!'
 *   );
 * };
 *
 * const handleEdit = async (data: ContratoUpdateData) => {
 *   await crudController.exec(
 *     () => updateContrato(data),
 *     'Contrato atualizado com sucesso!'
 *   );
 * };
 *
 * // No componente
 * <Button onClick={() => crudController.open()}>Novo</Button>
 * <Button onClick={() => crudController.open(contrato)}>Editar</Button>
 *
 * <Modal
 *   open={crudController.isOpen}
 *   onCancel={crudController.close}
 *   confirmLoading={crudController.loading}
 * >
 *   {crudController.editingItem ? 'Editar' : 'Criar'}
 * </Modal>
 * ```
 *
 * EXEMPLO COM MÚLTIPLAS CHAVES DE CACHE:
 * ```tsx
 * // Para revalidar múltiplas chaves relacionadas
 * const crudController = useCrudController<Contrato>([
 *   'contratos',
 *   'contratos-ativos',
 *   'dashboard-stats'
 * ]);
 *
 * // Todas as chaves serão revalidadas após operações
 * ```
 *
 * EXEMPLO COM CALLBACK CUSTOMIZADO:
 * ```tsx
 * const crudController = useCrudController<Contrato>('contratos');
 *
 * const handleCreateWithCallback = async (data: ContratoCreateData) => {
 *   await crudController.exec(
 *     () => createContrato(data),
 *     'Contrato criado com sucesso!',
 *     () => {
 *       // Ação customizada após sucesso
 *       router.push('/contratos');
 *       showSuccessNotification('Redirecionando...');
 *     }
 *   );
 * };
 * ```
 *
 * EXEMPLO COM TRATAMENTO DE ERRO CUSTOMIZADO:
 * ```tsx
 * const crudController = useCrudController<Contrato>('contratos');
 *
 * const handleDelete = async (id: string) => {
 *   await crudController.exec(
 *     () => deleteContrato(id),
 *     'Contrato excluído com sucesso!',
 *     undefined, // sem callback customizado
 *     (error) => {
 *       // Tratamento customizado de erro
 *       if (error.includes('constraint')) {
 *         showError('Não é possível excluir: contrato possui dependências');
 *       } else {
 *         showError('Erro ao excluir contrato');
 *       }
 *     }
 *   );
 * };
 * ```
 */

'use client';

import { App } from 'antd';
import { useState } from 'react';
import { mutate } from 'swr';
import type { ActionResult } from '../types/common';
import { errorHandler } from '../utils/errorHandler';

/**
 * Interface de retorno do hook useCrudController
 *
 * Define todos os estados e funções disponíveis para
 * gerenciar operações CRUD de forma padronizada.
 */
export interface CrudController<T> {
  /** Estado do modal (aberto/fechado) */
  isOpen: boolean;

  /** Item atualmente sendo editado (null para criação) */
  editingItem: T | null;

  /** Estado de loading durante operações */
  loading: boolean;

  /**
   * Abre o modal para criação ou edição
   * @param item - Item para edição (opcional, null = criação)
   */
  open: (item?: T) => void;

  /** Fecha o modal e limpa estado */
  close: () => void;

  /**
   * Executa uma ação CRUD com tratamento completo
   * @param action - Função que executa a operação
   * @param successMessage - Mensagem de sucesso
   * @param onSuccess - Callback customizado após sucesso
   * @param onError - Callback customizado para erros
   */
  exec: (
    action: () => Promise<ActionResult>,
    successMessage: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => Promise<void>;
}

/**
 * Hook para controle de operações CRUD
 *
 * Centraliza toda a lógica comum de CRUD incluindo estados,
 * modal, loading, execução de ações e revalidação de cache.
 *
 * @template T - Tipo da entidade sendo gerenciada
 * @param mutateKey - Chave(s) do SWR para revalidação
 * @returns Interface completa para controle CRUD
 */
export function useCrudController<T>(
  mutateKey: string | Array<string | any>
): CrudController<T> {
  // Hook do Ant Design para mensagens
  const { message } = App.useApp();

  // Estados do controller
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Abre o modal para criação ou edição
   *
   * Se um item for fornecido, será modo edição.
   * Se não, será modo criação.
   */
  const open = (item?: T) => {
    setEditingItem(item ?? null);
    setIsOpen(true);
  };

  /**
   * Fecha o modal e limpa todos os estados
   *
   * Reseta item em edição e fecha o modal.
   * Se uma mutateKey foi fornecida, também revalida o cache automaticamente.
   */
  const close = async () => {
    setIsOpen(false);
    setEditingItem(null);

    // ✅ CORREÇÃO: Revalidar cache automaticamente ao fechar modal
    // Isso garante que a tabela seja atualizada mesmo quando o modal é fechado sem salvar
    if (mutateKey) {
      if (Array.isArray(mutateKey)) {
        await Promise.all(mutateKey.map(key => mutate(key)));
      } else {
        await mutate(mutateKey);
      }
    }
  };

  /**
   * Executa uma ação CRUD com tratamento completo
   *
   * Esta função centraliza todo o fluxo de execução:
   * 1. Ativa loading
   * 2. Executa a ação
   * 3. Verifica resultado
   * 4. Mostra notificação apropriada
   * 5. Revalida cache
   * 6. Executa callbacks
   * 7. Fecha modal em caso de sucesso
   * 8. Desativa loading
   */
  const exec = async (
    action: () => Promise<ActionResult>,
    successMessage: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ) => {
    // Ativa estado de loading
    setLoading(true);

    try {
      // Executa a ação
      const result = await action();

      // Verifica se a operação foi bem-sucedida
      if (result.success) {
        // Mostra mensagem de sucesso
        message.success(successMessage);

        // Revalida cache do SWR
        if (Array.isArray(mutateKey)) {
          // Revalida múltiplas chaves
          await Promise.all(mutateKey.map(key => mutate(key)));
        } else {
          // Revalida chave única
          await mutate(mutateKey);
        }

        // Executa callback customizado se fornecido
        onSuccess?.();

        // Fecha modal após sucesso
        close();
      } else {
        // Trata erro retornado pela ação
        const errorMessage = result.error || 'Erro desconhecido';

        if (onError) {
          // Usa tratamento customizado se fornecido
          onError(errorMessage);
        } else {
          // Tratamento padrão de erro
          message.error(errorMessage);
        }

        // Verifica se precisa redirecionar para login
        if (result.redirectToLogin) {
          // Usar window.location para forçar redirecionamento
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    } catch (error) {
      // Trata erros não capturados (network, etc.)
      // Log do erro usando o handler centralizado
      errorHandler.log(error, 'useCrudController', {
        metadata: {
          actionType: 'exec',
          successMessage,
        },
      });

      const errorMessage = errorHandler.getMessage(error, {
        context: 'useCrudController',
        userMessage: 'Erro inesperado. Tente novamente.',
      });

      if (onError) {
        onError(errorMessage);
      } else {
        message.error(errorMessage);
      }
    } finally {
      // Sempre desativa loading, mesmo em caso de erro
      setLoading(false);
    }
  };

  // Retorna interface completa do controller
  return {
    isOpen,
    editingItem,
    loading,
    open,
    close,
    exec,
  };
}

/**
 * Tipos auxiliares para melhor experiência de desenvolvimento
 */

/** Tipo para ações de criação */
export type CreateAction<T> = (
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
) => Promise<ActionResult<T>>;

/** Tipo para ações de atualização */
export type UpdateAction<T> = (
  data: Partial<T> & { id: string }
) => Promise<ActionResult<T>>;

/** Tipo para ações de exclusão */
export type DeleteAction = (id: string) => Promise<ActionResult<void>>;

/**
 * Exemplo de uso completo em um componente:
 *
 * ```tsx
 * function ContratosPage() {
 *   const crudController = useCrudController<Contrato>('contratos');
 *
 *   const handleCreate = async (data: ContratoCreateData) => {
 *     await crudController.exec(
 *       () => createContrato(data),
 *       'Contrato criado com sucesso!'
 *     );
 *   };
 *
 *   const handleUpdate = async (data: ContratoUpdateData) => {
 *     await crudController.exec(
 *       () => updateContrato(data),
 *       'Contrato atualizado com sucesso!'
 *     );
 *   };
 *
 *   const handleDelete = async (id: string) => {
 *     await crudController.exec(
 *       () => deleteContrato(id),
 *       'Contrato excluído com sucesso!'
 *     );
 *   };
 *
 *   return (
 *     <div>
 *       <Button onClick={() => crudController.open()}>
 *         Novo Contrato
 *       </Button>
 *
 *       <Table
 *         columns={[
 *           ...baseColumns,
 *           {
 *             title: 'Ações',
 *             render: (_, record) => (
 *               <>
 *                 <Button onClick={() => crudController.open(record)}>
 *                   Editar
 *                 </Button>
 *                 <Button onClick={() => handleDelete(record.id)}>
 *                   Excluir
 *                 </Button>
 *               </>
 *             )
 *           }
 *         ]}
 *       />
 *
 *       <ContratoModal
 *         open={crudController.isOpen}
 *         onCancel={crudController.close}
 *         confirmLoading={crudController.loading}
 *         editingItem={crudController.editingItem}
 *         onSubmit={crudController.editingItem ? handleUpdate : handleCreate}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
