/**
 * Repositório para Bases
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Base, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome
 * - Filtro por contrato
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new BaseRepository();
 * const bases = await repository.list({ page: 1, pageSize: 10 });
 * const base = await repository.findById(1);
 * ```
 */

import { Prisma, Base } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

// Interface para filtros de base
interface BaseFilter extends PaginationParams {
  contratoId?: number;
}

export class BaseRepository extends AbstractCrudRepository<
  Base,
  BaseFilter
> {
  /**
   * Cria uma nova base
   *
   * @param data - Dados da base
   * @returns Base criada
   */
  create(data: Base): Promise<Base> {
    return prisma.base.create({
      data: {
        nome: data.nome,
        contrato: { connect: { id: data.contratoId } },
        createdBy: data.createdBy,
        createdAt: data.createdAt,
      },
    });
  }

  /**
   * Atualiza uma base existente
   *
   * @param id - ID da base
   * @param data - Dados para atualização
   * @returns Base atualizada
   */
  update(id: number, data: Partial<Base>): Promise<Base> {
    return prisma.base.update({
      where: { id },
      data: {
        nome: data.nome,
        contrato: data.contratoId ? { connect: { id: data.contratoId } } : undefined,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
      },
    });
  }

  /**
   * Exclui uma base (soft delete)
   *
   * @param id - ID da base
   * @param userId - ID do usuário que está excluindo
   * @returns Base excluída
   */
  delete(id: number, userId: string): Promise<Base> {
    return prisma.base.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca uma base por ID
   *
   * @param id - ID da base
   * @returns Base encontrada ou null
   */
  findById(id: number): Promise<Base | null> {
    return prisma.base.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome'];
  }

  /**
   * Executa a consulta findMany no Prisma
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de bases
   */
  protected findMany(
    where: Prisma.BaseWhereInput,
    orderBy: Prisma.BaseOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<Base[]> {
    return prisma.base.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Executa a consulta count no Prisma
   *
   * @param where - Condições de filtro
   * @returns Número total de bases
   */
  protected count(where: Prisma.BaseWhereInput): Promise<number> {
    return prisma.base.count({ where });
  }
}
