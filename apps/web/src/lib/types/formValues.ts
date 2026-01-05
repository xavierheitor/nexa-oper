/**
 * Tipos para Valores de Formulário
 *
 * Este arquivo define tipos genéricos e utilitários para valores
 * de formulário, baseados em schemas Zod e tipos de entidades.
 *
 * FUNCIONALIDADES:
 * - Tipos derivados de schemas Zod
 * - Type safety para valores de formulário
 * - Utilitários para transformação de dados
 *
 * BENEFÍCIOS:
 * - Elimina uso de `any` em handlers de formulário
 * - Type safety completo
 * - Integração com schemas Zod
 */

import type { z } from 'zod';

/**
 * Tipo para valores de formulário genérico
 * Baseado em um schema Zod
 *
 * @template TSchema - Schema Zod do formulário
 */
export type FormValues<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = z.infer<TSchema>;

/**
 * Tipo para valores de formulário de criação
 * Remove campos opcionais de auditoria e ID
 */
export type CreateFormValues<T extends Record<string, unknown>> = Omit<
  T,
  'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy'
>;

/**
 * Tipo para valores de formulário de atualização
 * Inclui ID obrigatório e campos opcionais
 */
export type UpdateFormValues<T extends Record<string, unknown>> = CreateFormValues<T> & {
  id: number | string;
};

/**
 * Tipo para valores parciais de formulário
 * Útil para valores iniciais e edição
 */
export type PartialFormValues<T extends Record<string, unknown>> = Partial<CreateFormValues<T>>;

/**
 * Tipo para transformação de valores de formulário
 * Permite transformar valores antes de enviar
 */
export type FormValueTransformer<TInput, TOutput = TInput> = (values: TInput) => TOutput;

/**
 * Tipo para valores de formulário do Ant Design
 * Compatível com Form.Item
 */
export type AntdFormValues = Record<string, unknown>;

/**
 * Tipo para valores de formulário com campos de data
 * Converte strings para Date quando necessário
 */
export type FormValuesWithDates<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends string | Date
    ? string | Date
    : T[K] extends Array<infer U>
    ? Array<FormValuesWithDates<U extends Record<string, unknown> ? U : never>>
    : T[K];
};

