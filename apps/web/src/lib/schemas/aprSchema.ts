/**
 * Schema de Validação para APR (Análise Preliminar de Risco)
 *
 * Define as regras de validação e tipos TypeScript para
 * operações CRUD da entidade Apr usando Zod.
 *
 * FUNCIONALIDADES:
 * - Validação de criação de APR
 * - Validação de atualização de APR
 * - Validação de filtros de listagem
 * - Geração automática de tipos TypeScript
 * - Integração com Server Actions
 * - Suporte a vinculação de perguntas e opções de resposta
 * - Suporte a paginação e ordenação
 *
 * ESTRUTURA:
 * - aprCreateSchema: Para criação (inclui arrays de IDs)
 * - aprUpdateSchema: Para atualização (inclui ID)
 * - aprFilterSchema: Para listagem com filtros
 *
 * VALIDAÇÕES:
 * - nome: String obrigatória (1-255 caracteres)
 * - perguntaIds: Array opcional de IDs de perguntas
 * - opcaoRespostaIds: Array opcional de IDs de opções de resposta
 * - Todos os campos de auditoria são gerenciados automaticamente
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Validação de criação
 * const novaApr = aprCreateSchema.parse({
 *   nome: "APR Soldagem",
 *   perguntaIds: [1, 2, 3],
 *   opcaoRespostaIds: [1, 2]
 * });
 *
 * // Validação de filtros
 * const filtros = aprFilterSchema.parse({
 *   page: 1,
 *   pageSize: 10,
 *   search: "Soldagem"
 * });
 * ```
 */

import { z } from 'zod';

/**
 * Schema para criação de nova APR
 *
 * Valida os dados necessários para criar uma nova APR,
 * incluindo os arrays de IDs para vinculação com perguntas
 * e opções de resposta.
 */
export const aprCreateSchema = z.object({
  /** Nome/título da APR (obrigatório, 1-255 caracteres) */
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
  
  /** Array de IDs das perguntas APR a serem vinculadas (opcional) */
  perguntaIds: z.array(z.number().int().positive('ID da pergunta deve ser positivo')).optional().default([]),
  
  /** Array de IDs das opções de resposta APR a serem vinculadas (opcional) */
  opcaoRespostaIds: z.array(z.number().int().positive('ID da opção de resposta deve ser positivo')).optional().default([]),
});

/**
 * Schema para atualização de APR existente
 *
 * Estende o schema de criação adicionando o campo ID obrigatório
 * para identificar qual APR deve ser atualizada.
 */
export const aprUpdateSchema = aprCreateSchema.extend({
  /** ID único da APR (obrigatório para atualizações) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Schema para filtros de listagem de APRs
 *
 * Define os parâmetros aceitos para busca, paginação,
 * ordenação e filtros na listagem de APRs.
 */
export const aprFilterSchema = z.object({
  /** Número da página para paginação (obrigatório) */
  page: z.number().int().positive('Página deve ser um número positivo'),
  
  /** Quantidade de itens por página (obrigatório) */
  pageSize: z.number().int().positive('Tamanho da página deve ser um número positivo'),
  
  /** Campo para ordenação (obrigatório) */
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  
  /** Direção da ordenação (obrigatório) */
  orderDir: z.enum(['asc', 'desc']),
  
  /** Termo de busca para filtrar APRs (opcional) */
  search: z.string().optional(),
  
  /** Configuração de includes para relacionamentos (opcional) */
  include: z.any().optional(),
});

// Exportação dos tipos TypeScript gerados automaticamente
export type AprCreate = z.infer<typeof aprCreateSchema>;
export type AprUpdate = z.infer<typeof aprUpdateSchema>;
export type AprFilter = z.infer<typeof aprFilterSchema>;
