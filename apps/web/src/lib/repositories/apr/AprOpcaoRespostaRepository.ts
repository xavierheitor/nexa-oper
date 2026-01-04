/**
 * Repository para APR Opção de Resposta
 *
 * Implementa o padrão Repository para a entidade AprOpcaoResposta,
 * fornecendo uma camada de abstração para acesso aos dados
 * e operações CRUD com o banco de dados.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD (Create, Read, Update, Delete)
 * - Implementação de soft delete
 * - Campos de auditoria automáticos
 * - Busca com filtros e paginação
 * - Integração com Prisma ORM
 * - Herança do AbstractCrudRepository
 *
 * FUNCIONALIDADES:
 * - create(): Criação com auditoria automática
 * - update(): Atualização com controle de versão
 * - delete(): Soft delete com timestamp
 * - findById(): Busca por ID (apenas ativos)
 * - findMany(): Busca paginada com filtros
 * - count(): Contagem para paginação
 * - list(): Listagem completa herdada do abstract
 *
 * AUDITORIA AUTOMÁTICA:
 * - createdAt/createdBy: Preenchidos na criação
 * - updatedAt/updatedBy: Preenchidos na atualização
 * - deletedAt/deletedBy: Preenchidos no soft delete
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const repo = new AprOpcaoRespostaRepository();
 *
 * // Criar opção de resposta
 * const opcao = await repo.create({
 *   nome: "Não Conforme",
 *   geraPendencia: true
 * }, "user123");
 *
 * // Buscar com filtros
 * const result = await repo.list({
 *   page: 1,
 *   pageSize: 10,
 *   search: "Conforme"
 * });
 * ```
 */

import { AprOpcaoResposta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

/**
 * Interface para filtros específicos de APR Opção de Resposta
 *
 * Estende PaginationParams com filtros específicos
 * da entidade AprOpcaoResposta se necessário.
 */
interface AprOpcaoRespostaFilter extends PaginationParams {}

/**
 * Repository para operações CRUD com APR Opção de Resposta
 *
 * Herda funcionalidades básicas do AbstractCrudRepository
 * e implementa métodos específicos da entidade AprOpcaoResposta.
 */
export class AprOpcaoRespostaRepository extends AbstractCrudRepository<
  AprOpcaoResposta,
  AprOpcaoRespostaFilter
> {
  /**
   * Cria uma nova opção de resposta APR no banco de dados
   *
   * Adiciona automaticamente campos de auditoria (createdAt, createdBy)
   * e persiste a opção de resposta no banco usando Prisma.
   *
   * @param data - Dados da opção de resposta a ser criada
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Promise com a opção de resposta criada
   *
   * @example
   * ```typescript
   * const opcao = await repo.create({
   *   nome: "Não Conforme",
   *   geraPendencia: true
   * }, "user123");
   * ```
   */
  create(
    data: Prisma.AprOpcaoRespostaCreateInput,
    userId?: string
  ): Promise<AprOpcaoResposta> {
    return prisma.aprOpcaoResposta.create({
      data,
    });
  }

  /**
   * Atualiza uma opção de resposta APR existente
   *
   * Adiciona automaticamente campos de auditoria (updatedAt, updatedBy)
   * e persiste as alterações no banco usando Prisma.
   *
   * @param id - ID da opção de resposta a ser atualizada
   * @param data - Dados a serem atualizados
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Promise com a opção de resposta atualizada
   *
   * @example
   * ```typescript
   * const opcao = await repo.update(1, {
   *   nome: "Parcialmente Conforme",
   *   geraPendencia: false
   * }, "user123");
   * ```
   */
  update(
    id: number,
    data: Prisma.AprOpcaoRespostaUpdateInput,
    userId?: string
  ): Promise<AprOpcaoResposta> {
    return prisma.aprOpcaoResposta.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Realiza soft delete de uma opção de resposta APR
   *
   * Não remove fisicamente do banco, apenas marca como deletada
   * adicionando timestamp e usuário responsável pela exclusão.
   *
   * @param id - ID da opção de resposta a ser deletada
   * @param userId - ID do usuário que está deletando
   * @returns Promise com a opção de resposta marcada como deletada
   *
   * @example
   * ```typescript
   * const opcao = await repo.delete(1, "user123");
   * ```
   */
  delete(id: number, userId: string): Promise<AprOpcaoResposta> {
    return prisma.aprOpcaoResposta.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Busca uma opção de resposta APR por ID
   *
   * Retorna apenas opções de resposta ativas (não deletadas).
   * Filtra automaticamente por deletedAt: null.
   *
   * @param id - ID da opção de resposta a ser buscada
   * @returns Promise com a opção de resposta encontrada ou null
   *
   * @example
   * ```typescript
   * const opcao = await repo.findById(1);
   * if (opcao) {
   *   console.log(opcao.nome, opcao.geraPendencia);
   * }
   * ```
   */
  findById(id: number): Promise<AprOpcaoResposta | null> {
    return prisma.aprOpcaoResposta.findUnique({
      where: { id, deletedAt: null }
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
   * Busca múltiplas opções de resposta APR com filtros
   *
   * Implementa a busca paginada com suporte a ordenação,
   * filtros e includes para relacionamentos.
   *
   * @param where - Condições WHERE do Prisma
   * @param orderBy - Ordenação do Prisma
   * @param skip - Quantidade de registros a pular (paginação)
   * @param take - Quantidade de registros a retornar (paginação)
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Promise com array de opções de resposta encontradas
   */
  protected findMany(
    where: Prisma.AprOpcaoRespostaWhereInput,
    orderBy: Prisma.AprOpcaoRespostaOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<AprOpcaoResposta[]> {
    return prisma.aprOpcaoResposta.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Conta o total de opções de resposta APR que atendem aos filtros
   *
   * Usado para cálculo de paginação e exibição de totais.
   * Considera apenas registros ativos (não deletados).
   *
   * @param where - Condições WHERE do Prisma
   * @returns Promise com o número total de registros
   */
  protected count(where: Prisma.AprOpcaoRespostaWhereInput): Promise<number> {
    return prisma.aprOpcaoResposta.count({ where });
  }
}
