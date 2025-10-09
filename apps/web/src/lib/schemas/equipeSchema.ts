import { z } from 'zod';

export const equipeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  tipoEquipeId: z.number().int(),
  contratoId: z.number().int(),
});

export const equipeUpdateSchema = equipeCreateSchema.extend({
  id: z.number().int(),
});

export const equipeFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

// Schema para cadastro em lote
export const equipeLoteItemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
});

export const equipeLoteSchema = z.object({
  contratoId: z.number().int().positive('Contrato é obrigatório'),
  tipoEquipeId: z.number().int().positive('Tipo de equipe é obrigatório'),
  equipes: z.array(equipeLoteItemSchema).min(1, 'Adicione pelo menos uma equipe'),
});

export type EquipeLoteInput = z.infer<typeof equipeLoteSchema>;
export type EquipeLoteItem = z.infer<typeof equipeLoteItemSchema>;

