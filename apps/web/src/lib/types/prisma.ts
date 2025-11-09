/**
 * Tipos auxiliares para Prisma
 *
 * Este arquivo centraliza tipos TypeScript para operações do Prisma,
 * evitando o uso de `any` e garantindo type safety.
 */

import type { Prisma } from '@nexa-oper/db';

/**
 * Tipo genérico para condições WHERE do Prisma
 */
export type PrismaWhereInput<T> = T extends Prisma.EletricistaWhereInput
  ? Prisma.EletricistaWhereInput
  : T extends Prisma.BaseWhereInput
  ? Prisma.BaseWhereInput
  : T extends Prisma.TurnoWhereInput
  ? Prisma.TurnoWhereInput
  : T extends Prisma.AprWhereInput
  ? Prisma.AprWhereInput
  : Prisma.JsonObject;

/**
 * Tipo genérico para ordenação do Prisma
 */
export type PrismaOrderByInput<T> = T extends Prisma.EletricistaOrderByWithRelationInput
  ? Prisma.EletricistaOrderByWithRelationInput
  : T extends Prisma.BaseOrderByWithRelationInput
  ? Prisma.BaseOrderByWithRelationInput
  : T extends Prisma.TurnoOrderByWithRelationInput
  ? Prisma.TurnoOrderByWithRelationInput
  : T extends Prisma.AprOrderByWithRelationInput
  ? Prisma.AprOrderByWithRelationInput
  : Prisma.JsonObject;

/**
 * Tipo genérico para includes do Prisma
 */
export type PrismaIncludeInput<T> = T extends Prisma.EletricistaInclude
  ? Prisma.EletricistaInclude
  : T extends Prisma.BaseInclude
  ? Prisma.BaseInclude
  : T extends Prisma.TurnoInclude
  ? Prisma.TurnoInclude
  : T extends Prisma.AprInclude
  ? Prisma.AprInclude
  : Record<string, unknown> | undefined;

/**
 * Tipo genérico para condições WHERE (qualquer modelo)
 */
export type GenericPrismaWhereInput = Prisma.JsonObject | Record<string, unknown>;

/**
 * Tipo genérico para ordenação (qualquer modelo)
 */
export type GenericPrismaOrderByInput = Prisma.JsonObject | Record<string, unknown>;

/**
 * Tipo genérico para includes (qualquer modelo)
 */
export type GenericPrismaIncludeInput = Record<string, unknown> | undefined;

