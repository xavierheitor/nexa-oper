/**
 * Utilitário para Tratamento de Redirecionamentos de Autenticação
 *
 * Este módulo fornece funções utilitárias para tratar redirecionamentos
 * para login quando ações retornam redirectToLogin: true.
 *
 * FUNCIONALIDADES:
 * - Verifica redirectToLogin em resultados de actions
 * - Redireciona para login quando necessário
 * - Funciona tanto no cliente quanto no servidor
 * - Previne renderização de conteúdo com valores zerados
 *
 * COMO USAR:
 * ```typescript
 * const result = await minhaAction();
 * handleRedirectToLogin(result);
 *
 * if (!result.success) {
 *   // Tratar erro normalmente
 * }
 * ```
 */

import type { ActionResult } from '../types/common';

/**
 * Verifica se o resultado de uma action requer redirecionamento para login
 * e executa o redirecionamento se necessário.
 *
 * @param result - Resultado de uma Server Action
 * @returns true se redirecionou, false caso contrário
 */
export function handleRedirectToLogin<T>(result: ActionResult<T>): boolean {
  if (result.redirectToLogin) {
    // No cliente, redireciona usando window.location
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
      return true;
    }

    // No servidor, lança erro para ser capturado pelo middleware
    // ou retorna redirect do Next.js
    throw new Error('Sessão expirada. Redirecionando para login.');
  }

  return false;
}

/**
 * Wrapper para actions que verifica redirectToLogin automaticamente
 *
 * @param action - Função que retorna uma Promise<ActionResult>
 * @returns Resultado da action ou redireciona para login
 */
export async function withAuthCheck<T>(
  action: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const result = await action();

  if (result.redirectToLogin) {
    handleRedirectToLogin(result);
  }

  return result;
}

