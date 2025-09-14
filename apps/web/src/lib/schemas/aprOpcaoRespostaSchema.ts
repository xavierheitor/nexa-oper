/**
 * Schema de Validação para APR Opção de Resposta
 *
 * Define as regras de validação e tipos TypeScript para
 * operações CRUD da entidade AprOpcaoResposta usando Zod.
 *
 * FUNCIONALIDADES:
 * - Validação de criação de opções de resposta APR
 * - Validação de atualização de opções de resposta APR
 * - Validação de filtros de listagem
 * - Geração automática de tipos TypeScript
 * - Integração com Server Actions
 * - Suporte a paginação e ordenação
 *
 * ESTRUTURA:
 * - aprOpcaoRespostaCreateSchema: Para criação
 * - aprOpcaoRespostaUpdateSchema: Para atualização (inclui ID)
 * - aprOpcaoRespostaFilterSchema: Para listagem com filtros
 *
 * VALIDAÇÕES:
 * - nome: String obrigatória (1-255 caracteres)
 * - geraPendencia: Boolean opcional (padrão: false)
 * - Todos os campos de auditoria são gerenciados automaticamente
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Validação de criação
 * const novaOpcao = aprOpcaoRespostaCreateSchema.parse({
 *   nome: "Não Conforme",
 *   geraPendencia: true
 * });
 *
 * // Validação de filtros
 * const filtros = aprOpcaoRespostaFilterSchema.parse({
 *   page: 1,
 *   pageSize: 10,
 *   search: "Conforme"
 * });
 * ```
 */

import { z } from 'zod';

/**
 * Schema para criação de nova opção de resposta APR
 *
 * Valida os dados necessários para criar uma nova opção de resposta,
 * incluindo apenas os campos que o usuário deve fornecer.
 * Campos de auditoria são adicionados automaticamente.
 */
export const aprOpcaoRespostaCreateSchema = z.object({
  /** Nome/texto da opção de resposta APR (obrigatório, 1-255 caracteres) */
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
});

/**
 * Schema para atualização de opção de resposta APR existente
 *
 * Estende o schema de criação adicionando o campo ID obrigatório
 * para identificar qual opção deve ser atualizada.
 */
export const aprOpcaoRespostaUpdateSchema = aprOpcaoRespostaCreateSchema.extend({
  /** ID único da opção de resposta APR (obrigatório para atualizações) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Schema para filtros de listagem de opções de resposta APR
 *
 * Define os parâmetros aceitos para busca, paginação,
 * ordenação e filtros na listagem de opções de resposta.
 */
export const aprOpcaoRespostaFilterSchema = z.object({
  /** Número da página para paginação (obrigatório) */
  page: z.number().int().positive('Página deve ser um número positivo'),
  
  /** Quantidade de itens por página (obrigatório) */
  pageSize: z.number().int().positive('Tamanho da página deve ser um número positivo'),
  
  /** Campo para ordenação (obrigatório) */
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  
  /** Direção da ordenação (obrigatório) */
  orderDir: z.enum(['asc', 'desc']),
  
  /** Termo de busca para filtrar opções de resposta (opcional) */
  search: z.string().optional(),
  
  /** Configuração de includes para relacionamentos (opcional) */
  include: z.any().optional(),
});

// Exportação dos tipos TypeScript gerados automaticamente
export type AprOpcaoRespostaCreate = z.infer<typeof aprOpcaoRespostaCreateSchema>;
export type AprOpcaoRespostaUpdate = z.infer<typeof aprOpcaoRespostaUpdateSchema>;
export type AprOpcaoRespostaFilter = z.infer<typeof aprOpcaoRespostaFilterSchema>;
