/**
 * Tipos auxiliares para Prisma
 *
 * Este arquivo centraliza tipos TypeScript para operações do Prisma,
 * evitando o uso de `any` e garantindo type safety.
 */

import { PrismaClient } from '@nexa-oper/db';

/**
 * Tipo para o cliente de transação do Prisma
 *
 * Representa o cliente Prisma dentro de uma transação, que é uma versão
 * do PrismaClient sem os métodos de gerenciamento de conexão e transação.
 *
 * @example
 * ```typescript
 * async function salvarDados(
 *   transaction?: PrismaTransactionClient
 * ): Promise<void> {
 *   const prisma = transaction || this.db.getPrisma();
 *   await prisma.turno.create({ data: {...} });
 * }
 * ```
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

