import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const aprGrupoTipoRespostaValues = ['opcao', 'checkbox', 'texto'] as const;

export const aprGrupoPerguntaCreateSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(255, 'Nome deve ter no máximo 255 caracteres'),
    tipoResposta: z.enum(aprGrupoTipoRespostaValues),
    perguntaIds: z
      .array(z.number().int().positive('ID da pergunta deve ser positivo'))
      .min(1, 'Selecione ao menos uma pergunta')
      .default([]),
    opcaoRespostaIds: z
      .array(z.number().int().positive('ID da opção deve ser positivo'))
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.tipoResposta === 'opcao' && data.opcaoRespostaIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['opcaoRespostaIds'],
        message: 'Selecione ao menos uma opção de resposta para o tipo opção',
      });
    }
  });

export const aprGrupoPerguntaUpdateSchema = aprGrupoPerguntaCreateSchema.extend({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

export const aprGrupoPerguntaFilterSchema = z.object({
  page: z.number().int().positive('Página deve ser um número positivo'),
  pageSize: z.number().int().positive('Tamanho da página deve ser um número positivo'),
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

export type AprGrupoPerguntaCreate = z.infer<typeof aprGrupoPerguntaCreateSchema>;
export type AprGrupoPerguntaUpdate = z.infer<typeof aprGrupoPerguntaUpdateSchema>;
export type AprGrupoPerguntaFilter = z.infer<typeof aprGrupoPerguntaFilterSchema>;
