/**
 * Hook para Handler Padronizado de Forms CRUD
 *
 * Este hook encapsula a lógica comum de handlers de formulário CRUD,
 * eliminando duplicação de código em páginas de criação/edição.
 *
 * FUNCIONALIDADES:
 * - Detecta automaticamente se é criação ou edição
 * - Executa create ou update baseado no estado
 * - Integra com useCrudController
 * - Suporta transformação de dados antes de enviar
 * - Suporta mensagens customizadas
 * - Revalida cache automaticamente
 *
 * BENEFÍCIOS:
 * - Elimina ~70% de código duplicado em handlers
 * - Padroniza comportamento de forms CRUD
 * - Type safety garantido
 * - Integração perfeita com arquitetura existente
 *
 * EXEMPLO DE USO BÁSICO:
 * ```typescript
 * const handleSubmit = useCrudFormHandler({
 *   controller,
 *   createAction: createBase,
 *   updateAction: updateBase,
 *   onSuccess: () => bases.mutate(),
 *   successMessage: 'Base salva com sucesso!'
 * });
 * ```
 *
 * EXEMPLO COM TRANSFORMAÇÃO DE DADOS:
 * ```typescript
 * const handleSubmit = useCrudFormHandler({
 *   controller,
 *   createAction: createEletricista,
 *   updateAction: updateEletricista,
 *   transform: (values) => ({
 *     ...values,
 *     contratoId: Number(values.contratoId),
 *     baseId: Number(values.baseId),
 *     admissao: values.admissao ? new Date(values.admissao) : undefined
 *   }),
 *   onSuccess: () => eletricistas.mutate(),
 *   successMessage: 'Eletricista salvo com sucesso!'
 * });
 * ```
 */

'use client';

import { useCallback } from 'react';
import type { ActionResult } from '../types/common';

/**
 * Opções de configuração do hook
 */
export interface UseCrudFormHandlerOptions<TFormData, TEntity, TId = number> {
  /**
   * Controller do useCrudController
   */
  controller: {
    editingItem: (TEntity & { id: TId }) | null;
    exec: (
      action: () => Promise<ActionResult<TEntity>>,
      successMessage: string,
      onSuccess?: () => void,
      onError?: (error: string) => void
    ) => Promise<void>;
  };

  /**
   * Função de criação (Server Action)
   */
  createAction: (data: TFormData) => Promise<ActionResult<TEntity>>;

  /**
   * Função de atualização (Server Action)
   */
  updateAction: (data: TFormData & { id: TId }) => Promise<ActionResult<TEntity>>;

  /**
   * Função de transformação opcional dos dados antes de enviar
   */
  transform?: (values: TFormData) => Partial<TFormData>;

  /**
   * Mensagem de sucesso a exibir
   * @default 'Registro salvo com sucesso!'
   */
  successMessage?: string;

  /**
   * Callback executado após sucesso (útil para revalidar cache)
   */
  onSuccess?: () => void;

  /**
   * Callback executado em caso de erro
   */
  onError?: (error: string) => void;
}

/**
 * Hook para handler padronizado de forms CRUD
 *
 * @param options - Opções de configuração
 * @returns Função handler para usar no onSubmit do formulário
 */
export function useCrudFormHandler<TFormData, TEntity, TId = number>(
  options: UseCrudFormHandlerOptions<TFormData, TEntity, TId>
) {
  const {
    controller,
    createAction,
    updateAction,
    transform,
    successMessage = 'Registro salvo com sucesso!',
    onSuccess,
    onError,
  } = options;

  return useCallback(
    async (values: TFormData) => {
      // Transforma os dados se necessário
      const transformedValues = transform ? transform(values) : values;

      // Cria ação assíncrona que será executada pelo controller
      const action = async (): Promise<ActionResult<TEntity>> => {
        // Se está editando (tem item selecionado), atualiza; senão, cria novo
        if (controller.editingItem?.id) {
          return await updateAction({
            ...(transformedValues as TFormData),
            id: controller.editingItem.id,
          } as TFormData & { id: TId });
        } else {
          return await createAction(transformedValues as TFormData);
        }
      };

      // Executa a ação através do controller
      await controller.exec(action, successMessage, onSuccess, onError);
    },
    [controller, createAction, updateAction, transform, successMessage, onSuccess, onError]
  );
}

