/**
 * Service para Vinculação APR-TipoAtividade
 *
 * Implementa a camada de serviço para vínculos entre APRs e Tipos de Atividade,
 * contendo a lógica de negócio e validações específicas.
 * Atua como intermediário entre Controllers/Actions e Repository.
 *
 * RESPONSABILIDADES:
 * - Lógica de negócio específica de vínculos APR-TipoAtividade
 * - Validação de dados usando Zod schemas
 * - Transformação de dados entre camadas
 * - Orquestração de operações de vinculação
 * - Gerenciamento de vínculos únicos por tipo de atividade
 * - Integração com Repository para persistência
 * - Herança do AbstractCrudService
 *
 * FUNCIONALIDADES ESPECIAIS:
 * - setMapping(): Criação/atualização de vínculos únicos
 * - Garantia de apenas um APR ativo por tipo de atividade
 * - Soft delete automático de vínculos anteriores
 * - Validações de integridade referencial
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const service = new AprTipoAtividadeVinculoService();
 *
 * // Criar/atualizar vínculo
 * const vinculo = await service.setMapping({
 *   tipoAtividadeId: 1,
 *   aprId: 2
 * }, "user123");
 *
 * // Listar vínculos ativos
 * const result = await service.list({
 *   page: 1,
 *   pageSize: 10,
 *   include: { apr: true, tipoAtividade: true }
 * });
 * ```
 */

import { AprTipoAtividadeRelacao } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { AprTipoAtividadeRelacaoRepository } from '../repositories/AprTipoAtividadeRelacaoRepository';
import {
    aprTipoAtividadeVinculoFilterSchema,
    setAprTipoAtividadeSchema,
} from '../schemas/aprTipoAtividadeVinculoSchema';
import { PaginatedResult } from '../types/common';
import { prisma } from '../db/db.service';

// Tipos derivados dos schemas Zod para type safety
type SetAprTipoAtividade = z.infer<typeof setAprTipoAtividadeSchema>;
type AprTipoAtividadeVinculoFilter = z.infer<typeof aprTipoAtividadeVinculoFilterSchema>;

/**
 * Service para operações de negócio com vínculos APR-TipoAtividade
 *
 * Herda funcionalidades básicas do AbstractCrudService
 * e implementa lógica específica da entidade AprTipoAtividadeRelacao,
 * incluindo gerenciamento de vínculos únicos por tipo de atividade.
 */
export class AprTipoAtividadeVinculoService extends AbstractCrudService<
  SetAprTipoAtividade,
  any, // Update não é usado neste contexto
  AprTipoAtividadeVinculoFilter,
  AprTipoAtividadeRelacao
> {
  /**
   * Construtor do service
   *
   * Inicializa o repository concreto e configura a herança
   * do AbstractCrudService para funcionalidades básicas.
   */
  constructor() {
    const repo = new AprTipoAtividadeRelacaoRepository();
    // Cast necessário pois os métodos create/update são sobrescritos nesta classe
    super(repo as any);
  }

  /**
   * Acessa o repository com tipo específico para operações customizadas
   */
  private get customRepo(): AprTipoAtividadeRelacaoRepository {
    return this.repo as unknown as AprTipoAtividadeRelacaoRepository;
  }

  /**
   * Cria ou atualiza vínculo APR-TipoAtividade
   *
   * Implementa a regra de negócio onde apenas uma APR pode estar
   * ativa por tipo de atividade. Remove vínculos anteriores e
   * cria novo vínculo ativo.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Valida dados de entrada via Zod schema
   * 2. Remove vínculos ativos anteriores (soft delete)
   * 3. Cria novo vínculo ativo
   * 4. Retorna o vínculo criado
   *
   * REGRAS DE NEGÓCIO:
   * - Apenas um APR ativo por tipo de atividade
   * - Vínculos anteriores são preservados para auditoria
   * - Novo vínculo sempre sobrescreve o anterior
   *
   * @param data - Dados validados do vínculo (tipoAtividadeId, aprId)
   * @param userId - ID do usuário que está criando o vínculo
   * @returns Promise com o vínculo criado
   *
   * @throws {ValidationError} Se os dados forem inválidos
   * @throws {ReferentialIntegrityError} Se IDs não existirem
   * @throws {Error} Se houver erro na persistência
   *
   * @example
   * ```typescript
   * // Vincular APR 5 ao Tipo de Atividade 2
   * const vinculo = await service.setMapping({
   *   tipoAtividadeId: 2,
   *   aprId: 5
   * }, "user123");
   *
   * // Se já existia APR 3 vinculada:
   * // - APR 3 é desvinculada (soft delete)
   * // - APR 5 é vinculada (novo registro ativo)
   *
   * // Atualizar vínculo existente
   * const novoVinculo = await service.setMapping({
   *   tipoAtividadeId: 2,
   *   aprId: 7  // Nova APR para o mesmo tipo
   * }, "user123");
   * ```
   */
  async setMapping(
    data: SetAprTipoAtividade,
    userId: string
  ): Promise<AprTipoAtividadeRelacao> {
    // Validação de regra de negócio: verificar se APR existe
    const apr = await prisma.apr.findUnique({
      where: { id: data.aprId },
      select: { id: true },
    });

    if (!apr) {
      throw new Error('APR não encontrado');
    }

    return this.customRepo.setActiveMapping(data.tipoAtividadeId, data.aprId, userId);
  }

  /**
   * Implementa método create requerido pelo AbstractCrudService
   * Delega para setMapping que é o método específico desta entidade
   */
  async create(data: SetAprTipoAtividade, userId: string): Promise<AprTipoAtividadeRelacao> {
    return this.setMapping(data, userId);
  }

  /**
   * Implementa método update requerido pelo AbstractCrudService
   * Update não é usado neste contexto - delega para setMapping
   */
  async update(data: any, userId: string): Promise<AprTipoAtividadeRelacao> {
    // Como update não é usado, tratamos como create/setMapping
    if (data.tipoAtividadeId && data.aprId) {
      return this.setMapping(
        {
          tipoAtividadeId: data.tipoAtividadeId,
          aprId: data.aprId,
        },
        userId
      );
    }
    throw new Error('Update não suportado para AprTipoAtividadeVinculo');
  }

  /**
   * Lista vínculos APR-TipoAtividade com paginação e filtros
   *
   * Busca vínculos aplicando filtros, ordenação e paginação.
   * Transforma o resultado do repository para formato padronizado.
   * Inclui relacionamentos com APR e TipoAtividade por padrão.
   *
   * @param params - Parâmetros de filtro, paginação e ordenação
   * @returns Promise com resultado paginado
   *
   * @example
   * ```typescript
   * const result = await service.list({
   *   page: 1,
   *   pageSize: 10,
   *   orderBy: 'id',
   *   orderDir: 'desc',
   *   include: {
   *     apr: true,
   *     tipoAtividade: true
   *   }
   * });
   *
   * console.log(`Encontrados ${result.total} vínculos`);
   * console.log(`Página ${result.page} de ${result.totalPages}`);
   *
   * // Acessar dados dos relacionamentos
   * result.data.forEach(vinculo => {
   *   console.log(`${vinculo.tipoAtividade.nome} -> ${vinculo.apr.nome}`);
   * });
   * ```
   */
  async list(
    params: AprTipoAtividadeVinculoFilter
  ): Promise<PaginatedResult<AprTipoAtividadeRelacao>> {
    // Busca dados via repository com includes padrão
    const { items, total } = await this.customRepo.list({
      ...params,
      include: params.include || {
        apr: true,
        tipoAtividade: true,
      },
    } as any);

    // Transforma para formato padronizado de resposta
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Define campos pesquisáveis para busca textual
   *
   * Como esta entidade é principalmente relacional,
   * não há campos de texto diretos para busca.
   * A busca pode ser implementada via relacionamentos.
   *
   * @returns Array vazio (sem campos pesquisáveis diretos)
   */
  protected getSearchFields(): string[] {
    return [];
  }
}

// Exporta o schema para uso nas actions
export { setAprTipoAtividadeSchema };

