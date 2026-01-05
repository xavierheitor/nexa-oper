/**
 * Repository para Vinculação APR-TipoAtividade
 *
 * Implementa o padrão Repository para a entidade AprTipoAtividadeRelacao,
 * fornecendo uma camada de abstração para acesso aos dados
 * e operações CRUD com o banco de dados.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Implementação de soft delete
 * - Campos de auditoria automáticos
 * - Busca com filtros e paginação
 * - Gerenciamento de vínculos únicos por tipo de atividade
 * - Integração com Prisma ORM
 * - Herança do AbstractCrudRepository
 *
 * FUNCIONALIDADES ESPECIAIS:
 * - setActiveMapping(): Gerencia vínculo único ativo por tipo
 * - Soft delete de vínculos anteriores
 * - Criação automática de novos vínculos ativos
 * - Índice único condicional para integridade
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const repo = new AprTipoAtividadeRelacaoRepository();
 *
 * // Criar vínculo único
 * const vinculo = await repo.setActiveMapping(
 *   tipoAtividadeId: 1,
 *   aprId: 2,
 *   userId: "user123"
 * );
 *
 * // Listar vínculos ativos
 * const vinculos = await repo.list({
 *   page: 1,
 *   pageSize: 10,
 *   include: { apr: true, tipoAtividade: true }
 * });
 * ```
 */

import { AprTipoAtividadeRelacao, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

/**
 * Interface para filtros específicos de AprTipoAtividadeRelacao
 *
 * Estende PaginationParams com filtros específicos
 * da entidade AprTipoAtividadeRelacao se necessário.
 */
interface Filter extends PaginationParams {}

/**
 * Repository para operações CRUD com vínculos APR-TipoAtividade
 *
 * Herda funcionalidades básicas do AbstractCrudRepository
 * e implementa métodos específicos da entidade AprTipoAtividadeRelacao,
 * incluindo gerenciamento de vínculos únicos por tipo de atividade.
 */
export class AprTipoAtividadeRelacaoRepository extends AbstractCrudRepository<
  AprTipoAtividadeRelacao,
  Filter
> {
  /**
   * Cria um novo vínculo APR-TipoAtividade no banco de dados
   *
   * Adiciona automaticamente campos de auditoria (createdAt, createdBy)
   * e persiste o vínculo no banco usando Prisma.
   *
   * @param data - Dados do vínculo a ser criado
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Promise com o vínculo criado
   */
  create(data: Prisma.AprTipoAtividadeRelacaoCreateInput, userId?: string): Promise<AprTipoAtividadeRelacao> {
    return prisma.aprTipoAtividadeRelacao.create({
      data: {
        ...data,
        createdAt: new Date(),
        createdBy: userId || 'system',
      },
    });
  }

  /**
   * Atualiza um vínculo APR-TipoAtividade existente
   *
   * Adiciona automaticamente campos de auditoria (updatedAt, updatedBy)
   * e persiste as alterações no banco usando Prisma.
   *
   * @param id - ID do vínculo a ser atualizado
   * @param data - Dados a serem atualizados
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Promise com o vínculo atualizado
   */
  update(
    id: number,
    data: Prisma.AprTipoAtividadeRelacaoUpdateInput,
    userId?: string
  ): Promise<AprTipoAtividadeRelacao> {
    return prisma.aprTipoAtividadeRelacao.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Realiza soft delete de um vínculo APR-TipoAtividade
   *
   * Não remove fisicamente do banco, apenas marca como deletado
   * adicionando timestamp e usuário responsável pela exclusão.
   *
   * @param id - ID do vínculo a ser deletado
   * @param userId - ID do usuário que está deletando
   * @returns Promise com o vínculo marcado como deletado
   */
  delete(id: number, userId: string): Promise<AprTipoAtividadeRelacao> {
    return prisma.aprTipoAtividadeRelacao.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  /**
   * Busca um vínculo APR-TipoAtividade por ID
   *
   * Retorna apenas vínculos ativos (não deletados).
   * Filtra automaticamente por deletedAt: null.
   *
   * @param id - ID do vínculo a ser buscado
   * @returns Promise com o vínculo encontrado ou null
   */
  findById(id: number): Promise<AprTipoAtividadeRelacao | null> {
    return prisma.aprTipoAtividadeRelacao.findUnique({
      where: { id, deletedAt: null } as any
    });
  }

  /**
   * Define campos pesquisáveis para busca textual
   *
   * Como esta entidade é principalmente relacional,
   * não há campos de texto para busca direta.
   *
   * @returns Array vazio (sem campos pesquisáveis)
   */
  protected getSearchFields(): string[] {
    return [];
  }

  /**
   * Busca múltiplos vínculos APR-TipoAtividade com filtros
   *
   * Implementa a busca paginada com suporte a ordenação,
   * filtros e includes para relacionamentos.
   *
   * @param where - Condições WHERE do Prisma
   * @param orderBy - Ordenação do Prisma
   * @param skip - Quantidade de registros a pular (paginação)
   * @param take - Quantidade de registros a retornar (paginação)
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Promise com array de vínculos encontrados
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<AprTipoAtividadeRelacao[]> {
    return prisma.aprTipoAtividadeRelacao.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  /**
   * Conta o total de vínculos APR-TipoAtividade que atendem aos filtros
   *
   * Usado para cálculo de paginação e exibição de totais.
   * Considera apenas registros ativos (não deletados).
   *
   * @param where - Condições WHERE do Prisma
   * @returns Promise com o número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.aprTipoAtividadeRelacao.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }

  /**
   * Gerencia vínculo único ativo entre TipoAtividade e APR
   *
   * Implementa a regra de negócio onde apenas uma APR pode estar
   * ativa por tipo de atividade. Remove vínculos anteriores (soft delete)
   * e cria um novo vínculo ativo.
   *
   * COMPORTAMENTO:
   * - Identifica vínculos existentes ativos para o tipo de atividade
   * - Realiza soft delete dos vínculos anteriores
   * - Cria novo vínculo ativo com a APR especificada
   * - Garante integridade referencial
   *
   * ÍNDICE ÚNICO:
   * - O Prisma schema tem índice único condicional
   * - @@unique([tipoAtividadeId, deletedAt])
   * - Garante apenas um vínculo ativo por tipo
   *
   * @param tipoAtividadeId - ID do tipo de atividade
   * @param aprId - ID da APR a ser vinculada
   * @param userId - ID do usuário responsável pela operação
   * @returns Promise com o novo vínculo criado
   *
   * @throws {Error} Se o tipo de atividade não existir
   * @throws {Error} Se a APR não existir
   * @throws {Error} Se houver erro de integridade referencial
   *
   * @example
   * ```typescript
   * // Vincular APR 5 ao Tipo de Atividade 2
   * const vinculo = await repo.setActiveMapping(2, 5, "user123");
   *
   * // Se já existia APR 3 vinculada ao Tipo 2:
   * // 1. APR 3 é desvinculada (soft delete)
   * // 2. APR 5 é vinculada (novo registro ativo)
   * // 3. Retorna o novo vínculo APR 5 <-> Tipo 2
   * ```
   */
  async setActiveMapping(
    tipoAtividadeId: number,
    aprId: number,
    userId: string
  ): Promise<AprTipoAtividadeRelacao> {
    // Soft-delete de vínculos ativos anteriores para este tipo de atividade
    await prisma.aprTipoAtividadeRelacao.updateMany({
      where: { tipoAtividadeId, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Cria novo vínculo ativo
    return prisma.aprTipoAtividadeRelacao.create({
      data: {
        apr: { connect: { id: aprId } },
        tipoAtividade: { connect: { id: tipoAtividadeId } },
        createdAt: new Date(),
        createdBy: userId,
      },
    });
  }
}
