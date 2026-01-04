/**
 * Tipos auxiliares para Prisma
 *
 * Este arquivo centraliza tipos TypeScript para operações do Prisma,
 * utilizando os tipos gerados automaticamente pelo Prisma para
 * garantir type safety completo e eliminar o uso de `any`.
 *
 * FUNCIONALIDADES:
 * - Tipos genéricos baseados nos tipos do Prisma
 * - Suporte a WhereInput, OrderByInput, IncludeInput
 * - Type safety completo em todas as operações
 *
 * BENEFÍCIOS:
 * - Eliminação de `any` em favor de tipos seguros
 * - Autocomplete completo do TypeScript
 * - Validação em tempo de compilação
 * - Consistência em toda a aplicação
 */

import type { Prisma } from '@nexa-oper/db';

/**
 * Tipo genérico para condições WHERE (qualquer modelo)
 * Usa Prisma.JsonObject como fallback quando não é possível inferir o tipo específico
 */
export type GenericPrismaWhereInput = Prisma.JsonObject | Record<string, unknown>;

/**
 * Tipo genérico para ordenação (qualquer modelo)
 * Usa Prisma.JsonObject como fallback quando não é possível inferir o tipo específico
 */
export type GenericPrismaOrderByInput = Prisma.JsonObject | Record<string, unknown>;

/**
 * Tipo genérico para includes (qualquer modelo)
 * Usado quando não é possível inferir o tipo específico
 */
export type GenericPrismaIncludeInput = Record<string, unknown> | undefined;

/**
 * Tipo genérico para select (qualquer modelo)
 * Usado quando não é possível inferir o tipo específico
 */
export type GenericPrismaSelectInput = Record<string, boolean> | undefined;
