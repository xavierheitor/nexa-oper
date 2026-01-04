/**
 * Repositório para Tipos de Equipe
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade TipoEquipe, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new TipoEquipeRepository();
 * const tipos = await repository.list({ page: 1, pageSize: 10 });
 * const tipo = await repository.findById(1);
 * ```
 */

import { Prisma, TipoEquipe } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';

// Interface para filtros de tipo de equipe
interface TipoEquipeFilter extends PaginationParams {
  // Campos específicos de filtro podem ser adicionados aqui
}

export class TipoEquipeRepository extends AbstractCrudRepository<
  TipoEquipe,
  TipoEquipeFilter
> {
  /**
   * Cria um novo tipo de equipe
   *
   * @param data - Dados do tipo de equipe
   * @param userId - ID do usuário que está criando
   * @returns Tipo de equipe criado
   */
  create(
    data: Prisma.TipoEquipeCreateInput,
    userId?: string
  ): Promise<TipoEquipe> {
    return prisma.tipoEquipe.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Atualiza um tipo de equipe existente
   *
   * @param id - ID do tipo de equipe
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de equipe atualizado
   */
  update(
    id: number,
    data: Prisma.TipoEquipeUpdateInput,
    userId?: string
  ): Promise<TipoEquipe> {
    return prisma.tipoEquipe.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Exclui um tipo de equipe (soft delete)
   *
   * @param id - ID do tipo de equipe
   * @param userId - ID do usuário que está excluindo
   * @returns Tipo de equipe excluído
   */
  delete(id: number, userId: string): Promise<TipoEquipe> {
    return prisma.tipoEquipe.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca um tipo de equipe por ID
   *
   * @param id - ID do tipo de equipe
   * @returns Tipo de equipe encontrado ou null
   */
  findById(id: number): Promise<TipoEquipe | null> {
    return prisma.tipoEquipe.findUnique({
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
   * @returns Array de tipos de equipe
   */
  protected findMany(
    where: Prisma.TipoEquipeWhereInput,
    orderBy: Prisma.TipoEquipeOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<TipoEquipe[]> {
    return prisma.tipoEquipe.findMany({
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
   * @returns Número total de tipos de equipe
   */
  protected count(where: Prisma.TipoEquipeWhereInput): Promise<number> {
    return prisma.tipoEquipe.count({ where });
  }
}

