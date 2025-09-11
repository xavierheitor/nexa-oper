import { z } from 'zod';

export const equipeSupervisorCreateSchema = z.object({
  supervisorId: z.number().int(),
  equipeId: z.number().int(),
  inicio: z.coerce.date(),
  fim: z.coerce.date().optional().nullable(),
});

export const equipeSupervisorUpdateSchema = equipeSupervisorCreateSchema.extend({
  id: z.number().int(),
});

export const equipeSupervisorFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

