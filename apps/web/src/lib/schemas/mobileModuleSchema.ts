import { z } from 'zod';

const mobileModuleFields = z.object({
  key: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(
      /^mobile\.[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
      'Use uma chave como mobile.turno.access'
    ),
  nome: z.string().trim().min(1).max(255),
  descricao: z.string().trim().max(500).optional().nullable(),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).default(0),
});

export const mobileModuleCreateSchema = mobileModuleFields;

export const mobileModuleUpdateSchema = mobileModuleFields.extend({
  id: z.number().int().positive(),
});

export const mobileModuleDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export const mobileModuleFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(10),
  orderBy: z.string().default('ordem'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  onlyActive: z.boolean().optional(),
});

export const mobileUserModulePermissionsSchema = z.object({
  mobileUserId: z.number().int().positive(),
});

export const setMobileUserModulePermissionsSchema = z.object({
  mobileUserId: z.number().int().positive(),
  moduleIds: z.array(z.number().int().positive()).max(200),
});

export type MobileModuleFormData = z.infer<typeof mobileModuleCreateSchema>;
