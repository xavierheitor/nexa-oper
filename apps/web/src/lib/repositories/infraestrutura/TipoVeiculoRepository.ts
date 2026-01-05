/**
 * Repositório para Tipos de Veículo
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade TipoVeiculo, utilizando o padrão Repository
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
 * const repository = new TipoVeiculoRepository();
 * const tipos = await repository.list({ page: 1, pageSize: 10 });
 * const tipo = await repository.findById(1);
 * ```
 */

import { Prisma, TipoVeiculo } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

// Interface para filtros de tipo de veículo
interface TipoVeiculoFilter extends PaginationParams {
  // Campos específicos de filtro podem ser adicionados aqui
}

export class TipoVeiculoRepository extends AbstractCrudRepository<
  TipoVeiculo,
  TipoVeiculoFilter
> {
  /**
   * Cria um novo tipo de veículo
   *
   * @param data - Dados do tipo de veículo
   * @param userId - ID do usuário que está criando
   * @returns Tipo de veículo criado
   */
  create(
    data: Prisma.TipoVeiculoCreateInput,
    userId?: string
  ): Promise<TipoVeiculo> {
    return prisma.tipoVeiculo.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Atualiza um tipo de veículo existente
   *
   * @param id - ID do tipo de veículo
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de veículo atualizado
   */
  update(
    id: number,
    data: Prisma.TipoVeiculoUpdateInput,
    userId?: string
  ): Promise<TipoVeiculo> {
    return prisma.tipoVeiculo.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Exclui um tipo de veículo (soft delete)
   *
   * @param id - ID do tipo de veículo
   * @param userId - ID do usuário que está excluindo
   * @returns Tipo de veículo excluído
   */
  delete(id: number, userId: string): Promise<TipoVeiculo> {
    return prisma.tipoVeiculo.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca um tipo de veículo por ID
   *
   * @param id - ID do tipo de veículo
   * @returns Tipo de veículo encontrado ou null
   */
  findById(id: number): Promise<TipoVeiculo | null> {
    return prisma.tipoVeiculo.findUnique({
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
   * @returns Array de tipos de veículo
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<TipoVeiculo[]> {
    return prisma.tipoVeiculo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  /**
   * Executa a consulta count no Prisma
   *
   * @param where - Condições de filtro
   * @returns Número total de tipos de veículo
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoVeiculo.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
