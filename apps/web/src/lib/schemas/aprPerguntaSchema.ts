/**
 * Schema de Validação para APR Pergunta
 *
 * Define as regras de validação e tipos TypeScript para
 * operações CRUD da entidade AprPergunta usando Zod.
 *
 * FUNCIONALIDADES:
 * - Validação de criação de perguntas APR
 * - Validação de atualização de perguntas APR
 * - Validação de filtros de listagem
 * - Geração automática de tipos TypeScript
 * - Integração com Server Actions
 * - Suporte a paginação e ordenação
 *
 * ESTRUTURA:
 * - aprPerguntaCreateSchema: Para criação
 * - aprPerguntaUpdateSchema: Para atualização (inclui ID)
 * - aprPerguntaFilterSchema: Para listagem com filtros
 *
 * VALIDAÇÕES:
 * - nome: String obrigatória (1-255 caracteres)
 * - Todos os campos de auditoria são gerenciados automaticamente
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Validação de criação
 * const novaPerguntar = aprPerguntaCreateSchema.parse({
 *   nome: "Você verificou os EPIs?"
 * });
 *
 * // Validação de filtros
 * const filtros = aprPerguntaFilterSchema.parse({
 *   page: 1,
 *   pageSize: 10,
 *   search: "EPI"
 * });
 * ```
 */

import { z } from 'zod';

/**
 * Schema para criação de nova pergunta APR
 *
 * Valida os dados necessários para criar uma nova pergunta,
 * incluindo apenas os campos que o usuário deve fornecer.
 * Campos de auditoria são adicionados automaticamente.
 */
export const aprPerguntaCreateSchema = z.object({
  /** Nome/texto da pergunta APR (obrigatório, 1-255 caracteres) */
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
});

/**
 * Schema para atualização de pergunta APR existente
 *
 * Estende o schema de criação adicionando o campo ID obrigatório
 * para identificar qual pergunta deve ser atualizada.
 */
export const aprPerguntaUpdateSchema = aprPerguntaCreateSchema.extend({
  /** ID único da pergunta APR (obrigatório para atualizações) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Schema para filtros de listagem de perguntas APR
 *
 * Define os parâmetros aceitos para busca, paginação,
 * ordenação e filtros na listagem de perguntas.
 */
export const aprPerguntaFilterSchema = z.object({
  /** Número da página para paginação (obrigatório) */
  page: z.number().int().positive('Página deve ser um número positivo'),
  
  /** Quantidade de itens por página (obrigatório) */
  pageSize: z.number().int().positive('Tamanho da página deve ser um número positivo'),
  
  /** Campo para ordenação (obrigatório) */
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  
  /** Direção da ordenação (obrigatório) */
  orderDir: z.enum(['asc', 'desc']),
  
  /** Termo de busca para filtrar perguntas (opcional) */
  search: z.string().optional(),
  
  /** Configuração de includes para relacionamentos (opcional) */
  include: z.any().optional(),
});

// Exportação dos tipos TypeScript gerados automaticamente
export type AprPerguntaCreate = z.infer<typeof aprPerguntaCreateSchema>;
export type AprPerguntaUpdate = z.infer<typeof aprPerguntaUpdateSchema>;
export type AprPerguntaFilter = z.infer<typeof aprPerguntaFilterSchema>;
