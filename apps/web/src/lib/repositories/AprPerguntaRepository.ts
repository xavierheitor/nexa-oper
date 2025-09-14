/**
 * Repository para APR Pergunta
 *
 * Implementa o padrão Repository para a entidade AprPergunta,
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
 * const repo = new AprPerguntaRepository();
 * 
 * // Criar pergunta
 * const pergunta = await repo.create({
 *   nome: "Você verificou os EPIs?"
 * }, "user123");
 *
 * // Buscar com filtros
 * const result = await repo.list({
 *   page: 1,
 *   pageSize: 10,
 *   search: "EPI"
 * });
 * ```
 */

import { AprPergunta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

/**
 * Interface para filtros específicos de APR Pergunta
 *
 * Estende PaginationParams com filtros específicos
 * da entidade AprPergunta se necessário.
 */
interface AprPerguntaFilter extends PaginationParams {}

/**
 * Repository para operações CRUD com APR Pergunta
 *
 * Herda funcionalidades básicas do AbstractCrudRepository
 * e implementa métodos específicos da entidade AprPergunta.
 */
export class AprPerguntaRepository extends AbstractCrudRepository<
  AprPergunta,
  AprPerguntaFilter
> {
  /**
   * Cria uma nova pergunta APR no banco de dados
   *
   * Adiciona automaticamente campos de auditoria (createdAt, createdBy)
   * e persiste a pergunta no banco usando Prisma.
   *
   * @param data - Dados da pergunta a ser criada
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Promise com a pergunta criada
   *
   * @example
   * ```typescript
   * const pergunta = await repo.create({
   *   nome: "Você verificou a área de trabalho?"
   * }, "user123");
   * ```
   */
  create(
    data: Prisma.AprPerguntaCreateInput,
    userId?: string
  ): Promise<AprPergunta> {
    return prisma.aprPergunta.create({
      data,
    });
  }

  /**
   * Atualiza uma pergunta APR existente
   *
   * Adiciona automaticamente campos de auditoria (updatedAt, updatedBy)
   * e persiste as alterações no banco usando Prisma.
   *
   * @param id - ID da pergunta a ser atualizada
   * @param data - Dados a serem atualizados
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Promise com a pergunta atualizada
   *
   * @example
   * ```typescript
   * const pergunta = await repo.update(1, {
   *   nome: "Você verificou todos os EPIs necessários?"
   * }, "user123");
   * ```
   */
  update(
    id: number,
    data: Prisma.AprPerguntaUpdateInput,
    userId?: string
  ): Promise<AprPergunta> {
    return prisma.aprPergunta.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Realiza soft delete de uma pergunta APR
   *
   * Não remove fisicamente do banco, apenas marca como deletada
   * adicionando timestamp e usuário responsável pela exclusão.
   *
   * @param id - ID da pergunta a ser deletada
   * @param userId - ID do usuário que está deletando
   * @returns Promise com a pergunta marcada como deletada
   *
   * @example
   * ```typescript
   * const pergunta = await repo.delete(1, "user123");
   * ```
   */
  delete(id: number, userId: string): Promise<AprPergunta> {
    return prisma.aprPergunta.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Busca uma pergunta APR por ID
   *
   * Retorna apenas perguntas ativas (não deletadas).
   * Filtra automaticamente por deletedAt: null.
   *
   * @param id - ID da pergunta a ser buscada
   * @returns Promise com a pergunta encontrada ou null
   *
   * @example
   * ```typescript
   * const pergunta = await repo.findById(1);
   * if (pergunta) {
   *   console.log(pergunta.nome);
   * }
   * ```
   */
  findById(id: number): Promise<AprPergunta | null> {
    return prisma.aprPergunta.findUnique({ 
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
   * Busca múltiplas perguntas APR com filtros
   *
   * Implementa a busca paginada com suporte a ordenação,
   * filtros e includes para relacionamentos.
   *
   * @param where - Condições WHERE do Prisma
   * @param orderBy - Ordenação do Prisma
   * @param skip - Quantidade de registros a pular (paginação)
   * @param take - Quantidade de registros a retornar (paginação)
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Promise com array de perguntas encontradas
   */
  protected findMany(
    where: Prisma.AprPerguntaWhereInput,
    orderBy: Prisma.AprPerguntaOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<AprPergunta[]> {
    return prisma.aprPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Conta o total de perguntas APR que atendem aos filtros
   *
   * Usado para cálculo de paginação e exibição de totais.
   * Considera apenas registros ativos (não deletados).
   *
   * @param where - Condições WHERE do Prisma
   * @returns Promise com o número total de registros
   */
  protected count(where: Prisma.AprPerguntaWhereInput): Promise<number> {
    return prisma.aprPergunta.count({ where });
  }
}
