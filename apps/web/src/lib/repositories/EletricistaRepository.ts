/**
 * Repositório para Eletricistas
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Eletricista, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome, matrícula e telefone
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new EletricistaRepository();
 * const eletricistas = await repository.list({ page: 1, pageSize: 10 });
 * const eletricista = await repository.findById(1);
 */

import { Eletricista } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { EletricistaCreate, EletricistaUpdate } from '../schemas/eletricistaSchema';
import { PaginationParams } from '../types/common';

interface EletricistaFilter extends PaginationParams {
  contratoId?: number;
}

export class EletricistaRepository extends AbstractCrudRepository<
  Eletricista,
  EletricistaFilter
> {
  /**
   * Cria um novo eletricista
   *
   * @param data - Dados do eletricista
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Eletricista criado
   */
  create(data: EletricistaCreate, userId?: string): Promise<Eletricista> {
    return prisma.eletricista.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  /**
   * Atualiza um eletricista existente
   *
   * @param id - ID do eletricista
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Eletricista atualizado
   */
  update(id: number, data: EletricistaUpdate, userId?: string): Promise<Eletricista> {
    return prisma.eletricista.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Exclui um eletricista existente
   *
   * @param id - ID do eletricista
   * @param userId - ID do usuário que está excluindo
   * @returns Eletricista excluído
   */
  delete(id: number, userId: string): Promise<Eletricista> {
    return prisma.eletricista.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca um eletricista por ID
   *
   * @param id - ID do eletricista
   * @returns Eletricista encontrado ou null
   */
  findById(id: number): Promise<Eletricista | null> {
    return prisma.eletricista.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'matricula', 'telefone'];
  }

  /**
   * Busca múltiplos eletricistas
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de eletricistas
   */
  protected findMany(where: any, orderBy: any, skip: number, take: number, include?: any): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Conta o número de eletricistas
   *
   * @param where - Condições de filtro
   * @returns Número total de eletricistas
   */
  protected count(where: any): Promise<number> {
    return prisma.eletricista.count({ where });
  }

  /**
   * Busca eletricistas por contrato
   *
   * @param contratoId - ID do contrato
   * @returns Array de eletricistas
   */
  findByContratoId(contratoId: number): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({ where: { contratoId, deletedAt: null } });
  }

  /**
   * Busca eletricistas por nome
   *
   * @param nome - Nome do eletricista
   * @returns Array de eletricistas
   */
  findByNome(nome: string): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({ where: { nome, deletedAt: null } });
  }

  /**
   * Busca eletricistas por matrícula
   *
   * @param matricula - Matrícula do eletricista
   * @returns Array de eletricistas
   */
  findByMatricula(matricula: string): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({ where: { matricula, deletedAt: null } });
  }
}
