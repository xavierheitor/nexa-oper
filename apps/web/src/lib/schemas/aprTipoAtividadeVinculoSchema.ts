/**
 * Schema de Validação para Vinculação APR-TipoAtividade
 *
 * Define as regras de validação e tipos TypeScript para
 * operações de vinculação entre APRs e Tipos de Atividade usando Zod.
 *
 * FUNCIONALIDADES:
 * - Validação de criação de vínculos APR-TipoAtividade
 * - Validação de filtros de listagem
 * - Geração automática de tipos TypeScript
 * - Integração com Server Actions
 * - Suporte a paginação e ordenação
 *
 * ESTRUTURA:
 * - setAprTipoAtividadeSchema: Para criar/atualizar vínculos
 * - aprTipoAtividadeVinculoFilterSchema: Para listagem com filtros
 *
 * VALIDAÇÕES:
 * - tipoAtividadeId: ID obrigatório do tipo de atividade
 * - aprId: ID obrigatório da APR
 * - Relacionamento único por tipo de atividade (um APR ativo por tipo)
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Validação de vínculo
 * const vinculo = setAprTipoAtividadeSchema.parse({
 *   tipoAtividadeId: 1,
 *   aprId: 2
 * });
 *
 * // Validação de filtros
 * const filtros = aprTipoAtividadeVinculoFilterSchema.parse({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'id',
 *   orderDir: 'desc'
 * });
 * ```
 */

import { z } from 'zod';

/**
 * Schema para criação/atualização de vínculo APR-TipoAtividade
 *
 * Valida os dados necessários para criar ou atualizar um vínculo
 * entre uma APR e um Tipo de Atividade.
 *
 * COMPORTAMENTO:
 * - Apenas um APR pode estar ativo por tipo de atividade
 * - Vínculos anteriores são automaticamente desativados (soft delete)
 * - Novos vínculos são criados como ativos
 */
export const setAprTipoAtividadeSchema = z.object({
  /** ID do tipo de atividade (obrigatório) */
  tipoAtividadeId: z
    .number()
    .int()
    .positive('ID do tipo de atividade deve ser positivo'),

  /** ID da APR a ser vinculada (obrigatório) */
  aprId: z.number().int().positive('ID da APR deve ser positivo'),
});

/**
 * Schema para filtros de listagem de vínculos APR-TipoAtividade
 *
 * Define os parâmetros aceitos para busca, paginação,
 * ordenação e filtros na listagem de vínculos.
 */
export const aprTipoAtividadeVinculoFilterSchema = z.object({
  /** Número da página para paginação (obrigatório) */
  page: z.number().int().positive('Página deve ser um número positivo'),

  /** Quantidade de itens por página (obrigatório) */
  pageSize: z
    .number()
    .int()
    .positive('Tamanho da página deve ser um número positivo'),

  /** Campo para ordenação (obrigatório) */
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),

  /** Direção da ordenação (obrigatório) */
  orderDir: z.enum(['asc', 'desc']),

  /** Termo de busca para filtrar vínculos (opcional) */
  search: z.string().optional(),

  /** Configuração de includes para relacionamentos (opcional) */
  include: z.any().optional(),
});

// Exportação dos tipos TypeScript gerados automaticamente
export type SetAprTipoAtividade = z.infer<typeof setAprTipoAtividadeSchema>;
export type AprTipoAtividadeVinculoFilter = z.infer<
  typeof aprTipoAtividadeVinculoFilterSchema
>;
