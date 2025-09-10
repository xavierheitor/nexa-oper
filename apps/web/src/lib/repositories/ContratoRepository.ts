/**
 * Repositório para Contratos
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Contrato, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca em campos nome e numero
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new ContratoRepository();
 * const contratos = await repository.list({ page: 1, pageSize: 10 });
 * const contrato = await repository.findById(1);
 * ```
 */

import { Contrato, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

// Interface para filtros de contrato
interface ContratoFilter extends PaginationParams {
  // Campos específicos de filtro podem ser adicionados aqui
}

export class ContratoRepository extends AbstractCrudRepository<
  Contrato,
  ContratoFilter
> {
  /**
   * Cria um novo contrato
   *
   * @param data - Dados do contrato
   * @returns Contrato criado
   */
  create(data: Prisma.ContratoCreateInput): Promise<Contrato> {
    return prisma.contrato.create({ data });
  }

  /**
   * Atualiza um contrato existente
   *
   * @param id - ID do contrato
   * @param data - Dados para atualização
   * @returns Contrato atualizado
   */
  update(id: number, data: Prisma.ContratoUpdateInput): Promise<Contrato> {
    return prisma.contrato.update({ where: { id }, data });
  }

  /**
   * Exclui um contrato (soft delete)
   *
   * @param id - ID do contrato
   * @param userId - ID do usuário que está excluindo
   * @returns Contrato excluído
   */
  delete(id: number, userId: string): Promise<Contrato> {
    return prisma.contrato.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  /**
   * Busca um contrato por ID
   *
   * @param id - ID do contrato
   * @returns Contrato encontrado ou null
   */
  findById(id: number): Promise<Contrato | null> {
    return prisma.contrato.findUnique({ where: { id, deletedAt: null } });
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'numero'];
  }

  /**
   * Executa a consulta findMany no Prisma
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de contratos
   */
  protected findMany(
    where: Prisma.ContratoWhereInput,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<Contrato[]> {
    return prisma.contrato.findMany({
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
   * @returns Número total de contratos
   */
  protected count(where: Prisma.ContratoWhereInput): Promise<number> {
    return prisma.contrato.count({ where });
  }
}
