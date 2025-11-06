/**
 * Utilitários de Timeout para Operações Assíncronas
 *
 * Fornece helpers para adicionar timeouts configuráveis
 * em operações que podem demorar muito tempo.
 */

import { RequestTimeoutException } from '@nestjs/common';

/**
 * Configurações de timeout padrão (em milissegundos)
 */
export const TIMEOUT_CONFIG = {
  /**
   * Timeout para transações de banco de dados
   * Padrão: 30 segundos
   */
  TRANSACTION: parseInt(
    process.env.TIMEOUT_TRANSACTION_MS || '30000',
    10
  ),

  /**
   * Timeout para operações de sincronização
   * Padrão: 60 segundos
   */
  SYNC: parseInt(process.env.TIMEOUT_SYNC_MS || '60000', 10),

  /**
   * Timeout para processamento assíncrono de checklists
   * Padrão: 45 segundos
   */
  CHECKLIST_PROCESSING: parseInt(
    process.env.TIMEOUT_CHECKLIST_PROCESSING_MS || '45000',
    10
  ),

  /**
   * Timeout para queries complexas
   * Padrão: 20 segundos
   */
  QUERY: parseInt(process.env.TIMEOUT_QUERY_MS || '20000', 10),
};

/**
 * Cria uma Promise que rejeita após o timeout especificado
 *
 * @param timeoutMs - Tempo em milissegundos antes de rejeitar
 * @param errorMessage - Mensagem de erro personalizada (opcional)
 * @returns Promise que rejeita com RequestTimeoutException
 */
function createTimeoutPromise(
  timeoutMs: number,
  errorMessage?: string
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new RequestTimeoutException(
          errorMessage ||
            `Operação excedeu o tempo limite de ${timeoutMs / 1000}s`
        )
      );
    }, timeoutMs);
  });
}

/**
 * Executa uma operação assíncrona com timeout
 *
 * A operação será cancelada se exceder o tempo limite especificado.
 * O timeout não cancela a operação em si, apenas rejeita a Promise.
 *
 * @param operation - Operação assíncrona a ser executada
 * @param timeoutMs - Tempo limite em milissegundos
 * @param errorMessage - Mensagem de erro personalizada (opcional)
 * @returns Resultado da operação se completar dentro do timeout
 * @throws RequestTimeoutException se o timeout for excedido
 *
 * @example
 * ```typescript
 * // Com timeout padrão de transação
 * const result = await withTimeout(
 *   this.db.getPrisma().$transaction(async tx => {
 *     // operações longas...
 *   }),
 *   TIMEOUT_CONFIG.TRANSACTION
 * );
 *
 * // Com timeout e mensagem personalizada
 * const result = await withTimeout(
 *   this.processarChecklists(checklists),
 *   TIMEOUT_CONFIG.CHECKLIST_PROCESSING,
 *   'Processamento de checklists excedeu o tempo limite'
 * );
 * ```
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    operation,
    createTimeoutPromise(timeoutMs, errorMessage),
  ]);
}

/**
 * Executa uma transação Prisma com timeout
 *
 * Helper específico para transações que podem demorar muito tempo.
 *
 * @param transactionFn - Função de transação do Prisma
 * @param timeoutMs - Tempo limite em milissegundos (padrão: TIMEOUT_CONFIG.TRANSACTION)
 * @returns Resultado da transação se completar dentro do timeout
 * @throws RequestTimeoutException se o timeout for excedido
 *
 * @example
 * ```typescript
 * const result = await withTransactionTimeout(
 *   this.db.getPrisma().$transaction(async tx => {
 *     // operações dentro da transação...
 *   })
 * );
 * ```
 */
export async function withTransactionTimeout<T>(
  transactionFn: Promise<T>,
  timeoutMs: number = TIMEOUT_CONFIG.TRANSACTION
): Promise<T> {
  return withTimeout(
    transactionFn,
    timeoutMs,
    `Transação excedeu o tempo limite de ${timeoutMs / 1000}s`
  );
}

/**
 * Executa uma operação de sincronização com timeout
 *
 * Helper específico para operações de sincronização que podem retornar muitos dados.
 *
 * @param syncOperation - Operação de sincronização
 * @param timeoutMs - Tempo limite em milissegundos (padrão: TIMEOUT_CONFIG.SYNC)
 * @returns Resultado da sincronização se completar dentro do timeout
 * @throws RequestTimeoutException se o timeout for excedido
 *
 * @example
 * ```typescript
 * const dados = await withSyncTimeout(
 *   this.findAllForSync()
 * );
 * ```
 */
export async function withSyncTimeout<T>(
  syncOperation: Promise<T>,
  timeoutMs: number = TIMEOUT_CONFIG.SYNC
): Promise<T> {
  return withTimeout(
    syncOperation,
    timeoutMs,
    `Sincronização excedeu o tempo limite de ${timeoutMs / 1000}s`
  );
}

