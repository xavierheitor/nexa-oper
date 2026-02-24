/**
 * Repository para APR (Análise Preliminar de Risco)
 *
 * Implementa o padrão Repository para a entidade Apr,
 * fornecendo uma camada de abstração para acesso aos dados
 * e operações CRUD com o banco de dados.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Implementação de soft delete
 * - Campos de auditoria automáticos
 * - Busca com filtros e paginação
 * - Gerenciamento de relacionamentos com perguntas
 * - Gerenciamento de relacionamentos com opções de resposta
 * - Integração com Prisma ORM
 * - Herança do AbstractCrudRepository
 *
 * FUNCIONALIDADES ESPECIAIS:
 * - setPerguntas(): Gerencia vinculação de perguntas APR
 * - setOpcoes(): Gerencia vinculação de opções de resposta APR
 * - Soft delete em relacionamentos
 * - Criação/remoção dinâmica de vínculos
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const repo = new AprRepository();
 *
 * // Criar APR
 * const apr = await repo.create({
 *   nome: "APR Soldagem"
 * }, "user123");
 *
 * // Vincular perguntas
 * await repo.setPerguntas(apr.id, [1, 2, 3], "user123");
 *
 * // Vincular opções de resposta
 * await repo.setOpcoes(apr.id, [1, 2], "user123");
 * ```
 */

import { Apr, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

/**
 * Interface para filtros específicos de APR
 *
 * Estende PaginationParams com filtros específicos
 * da entidade Apr se necessário.
 */
interface AprFilter extends PaginationParams {}

/**
 * Repository para operações CRUD com APR
 *
 * Herda funcionalidades básicas do AbstractCrudRepository
 * e implementa métodos específicos da entidade Apr, incluindo
 * gerenciamento de relacionamentos com perguntas e opções de resposta.
 */
export class AprRepository extends AbstractCrudRepository<Apr, AprFilter> {
  /**
   * Cria uma nova APR no banco de dados
   *
   * Adiciona automaticamente campos de auditoria (createdAt, createdBy)
   * e persiste a APR no banco usando Prisma.
   *
   * @param data - Dados da APR a ser criada
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Promise com a APR criada
   */
  create(data: Prisma.AprCreateInput, _userId?: string): Promise<Apr> {
    return prisma.apr.create({
      data,
    });
  }

  /**
   * Atualiza uma APR existente
   *
   * Adiciona automaticamente campos de auditoria (updatedAt, updatedBy)
   * e persiste as alterações no banco usando Prisma.
   *
   * @param id - ID da APR a ser atualizada
   * @param data - Dados a serem atualizados
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Promise com a APR atualizada
   */
  update(
    id: number,
    data: Prisma.AprUpdateInput,
    userId?: string
  ): Promise<Apr> {
    return prisma.apr.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Realiza soft delete de uma APR
   *
   * Não remove fisicamente do banco, apenas marca como deletada
   * adicionando timestamp e usuário responsável pela exclusão.
   *
   * @param id - ID da APR a ser deletada
   * @param userId - ID do usuário que está deletando
   * @returns Promise com a APR marcada como deletada
   */
  delete(id: number, userId: string): Promise<Apr> {
    return prisma.apr.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Busca uma APR por ID
   *
   * Retorna apenas APRs ativas (não deletadas).
   * Filtra automaticamente por deletedAt: null.
   * Inclui automaticamente os relacionamentos com perguntas e opções de resposta.
   *
   * @param id - ID da APR a ser buscada
   * @returns Promise com a APR encontrada ou null
   */
  findById(id: number): Promise<Apr | null> {
    return prisma.apr.findUnique({
      where: { id, deletedAt: null },
      include: {
        AprPerguntaRelacao: {
          where: { deletedAt: null },
          select: { id: true, aprPerguntaId: true },
        },
        AprOpcaoRespostaRelacao: {
          where: { deletedAt: null },
          select: { id: true, aprOpcaoRespostaId: true },
        },
      },
    });
  }

  /**
   * Define campos pesquisáveis para busca textual
   *
   * Especifica quais campos da entidade podem ser usados
   * na busca por texto livre implementada no AbstractCrudRepository.
   *
   * @returns Array com nomes dos campos pesquisáveis
   */
  protected getSearchFields(): string[] {
    return ['nome'];
  }

  /**
   * Busca múltiplas APRs com filtros
   *
   * Implementa a busca paginada com suporte a ordenação,
   * filtros e includes para relacionamentos.
   *
   * @param where - Condições WHERE do Prisma
   * @param orderBy - Ordenação do Prisma
   * @param skip - Quantidade de registros a pular (paginação)
   * @param take - Quantidade de registros a retornar (paginação)
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Promise com array de APRs encontradas
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Apr[]> {
    return prisma.apr.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  /**
   * Conta o total de APRs que atendem aos filtros
   *
   * Usado para cálculo de paginação e exibição de totais.
   * Considera apenas registros ativos (não deletados).
   *
   * @param where - Condições WHERE do Prisma
   * @returns Promise com o número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.apr.count({ where });
  }

  /**
   * Gerencia relacionamentos entre APR e Perguntas
   *
   * Atualiza dinamicamente os vínculos entre uma APR e suas perguntas,
   * realizando soft delete dos vínculos removidos e criando novos vínculos.
   *
   * COMPORTAMENTO:
   * - Identifica vínculos existentes ativos
   * - Remove vínculos não presentes na nova lista (soft delete)
   * - Adiciona novos vínculos não existentes
   * - Preserva vínculos que permanecem inalterados
   *
   * @param aprId - ID da APR
   * @param perguntaIds - Array de IDs das perguntas a serem vinculadas
   * @param userId - ID do usuário responsável pelas alterações
   *
   * @example
   * ```typescript
   * // Vincular perguntas 1, 2, 3 à APR
   * await repo.setPerguntas(aprId, [1, 2, 3], "user123");
   *
   * // Atualizar para apenas pergunta 2, 4
   * // (remove 1 e 3, mantém 2, adiciona 4)
   * await repo.setPerguntas(aprId, [2, 4], "user123");
   * ```
   */
  async setPerguntas(aprId: number, perguntaIds: number[], userId: string) {
    // Busca relações existentes ativas
    const existing = await prisma.aprPerguntaRelacao.findMany({
      where: { aprId, deletedAt: null },
      select: { id: true, aprPerguntaId: true },
    });

    // Conjuntos para comparação
    const currentIds = new Set(existing.map(e => e.aprPerguntaId));
    const targetIds = new Set(perguntaIds);

    // Soft delete de relações removidas
    const toRemove = existing.filter(e => !targetIds.has(e.aprPerguntaId));
    await Promise.all(
      toRemove.map(rel =>
        prisma.aprPerguntaRelacao.update({
          where: { id: rel.id },
          data: { deletedAt: new Date(), deletedBy: userId },
        })
      )
    );

    // Adicionar novas relações
    const toAdd = Array.from(targetIds).filter(id => !currentIds.has(id));
    await Promise.all(
      toAdd.map(perguntaId =>
        prisma.aprPerguntaRelacao.create({
          data: {
            apr: { connect: { id: aprId } },
            aprPergunta: { connect: { id: perguntaId } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  /**
   * Gerencia relacionamentos entre APR e Opções de Resposta
   *
   * Atualiza dinamicamente os vínculos entre uma APR e suas opções de resposta,
   * realizando soft delete dos vínculos removidos e criando novos vínculos.
   *
   * COMPORTAMENTO:
   * - Identifica vínculos existentes ativos
   * - Remove vínculos não presentes na nova lista (soft delete)
   * - Adiciona novos vínculos não existentes
   * - Preserva vínculos que permanecem inalterados
   *
   * @param aprId - ID da APR
   * @param opcaoIds - Array de IDs das opções de resposta a serem vinculadas
   * @param userId - ID do usuário responsável pelas alterações
   *
   * @example
   * ```typescript
   * // Vincular opções 1, 2 à APR
   * await repo.setOpcoes(aprId, [1, 2], "user123");
   *
   * // Atualizar para opções 2, 3, 4
   * // (mantém 2, remove 1, adiciona 3 e 4)
   * await repo.setOpcoes(aprId, [2, 3, 4], "user123");
   * ```
   */
  async setOpcoes(aprId: number, opcaoIds: number[], userId: string) {
    // Busca relações existentes ativas
    const existing = await prisma.aprOpcaoRespostaRelacao.findMany({
      where: { aprId, deletedAt: null },
      select: { id: true, aprOpcaoRespostaId: true },
    });

    // Conjuntos para comparação
    const currentIds = new Set(existing.map(e => e.aprOpcaoRespostaId));
    const targetIds = new Set(opcaoIds);

    // Soft delete de relações removidas
    const toRemove = existing.filter(e => !targetIds.has(e.aprOpcaoRespostaId));
    await Promise.all(
      toRemove.map(rel =>
        prisma.aprOpcaoRespostaRelacao.update({
          where: { id: rel.id },
          data: { deletedAt: new Date(), deletedBy: userId },
        })
      )
    );

    // Adicionar novas relações
    const toAdd = Array.from(targetIds).filter(id => !currentIds.has(id));
    await Promise.all(
      toAdd.map(opcaoId =>
        prisma.aprOpcaoRespostaRelacao.create({
          data: {
            apr: { connect: { id: aprId } },
            aprOpcaoResposta: { connect: { id: opcaoId } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
