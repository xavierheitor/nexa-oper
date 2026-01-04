/**
 * Repositório para Faltas
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Falta, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Filtros por eletricista, equipe, data e status
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new FaltaRepository();
 * const faltas = await repository.list({ page: 1, pageSize: 10 });
 * const falta = await repository.findById(1);
 * ```
 */

import { Falta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface FaltaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
}

export class FaltaRepository extends AbstractCrudRepository<
  Falta,
  FaltaFilter
> {
  /**
   * Cria uma nova falta
   *
   * @param data - Dados da falta
   * @returns Falta criada
   */
  async create(data: Prisma.FaltaCreateInput): Promise<Falta> {
    return prisma.falta.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Atualiza uma falta existente
   *
   * @param id - ID da falta
   * @param data - Dados para atualização
   * @returns Falta atualizada
   */
  async update(id: number | string, data: Prisma.FaltaUpdateInput): Promise<Falta> {
    return prisma.falta.update({
      where: { id: Number(id) },
      data,
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Exclui uma falta (hard delete)
   *
   * NOTA: Faltas são registros históricos e normalmente não devem ser deletadas.
   * Este método existe apenas para completar a interface do repositório.
   *
   * @param id - ID da falta
   * @param userId - ID do usuário que está excluindo (não usado, mas requerido pela interface)
   * @returns Falta excluída
   */
  async delete(id: number | string, userId: string): Promise<Falta> {
    return prisma.falta.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Busca uma falta por ID
   *
   * @param id - ID da falta
   * @returns Falta encontrada ou null
   */
  async findById(id: number | string): Promise<Falta | null> {
    return prisma.falta.findUnique({
      where: { id: Number(id) },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Define quais campos podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['motivoSistema'];
  }

  /**
   * Executa a consulta findMany no ORM
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de registros
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Falta[]> {
    return prisma.falta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  /**
   * Executa a consulta count no ORM
   *
   * @param where - Condições de filtro
   * @returns Número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.falta.count({ where });
  }

  /**
   * Lista faltas com filtros e paginação
   *
   * Sobrescreve o método base para adicionar suporte a filtros customizados
   */
  async list(params: FaltaFilter): Promise<{ items: Falta[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'dataReferencia',
      orderDir = 'desc',
      search,
      eletricistaId,
      equipeId,
      dataInicio,
      dataFim,
      status,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros customizados
    const where: any = {};

    if (eletricistaId) {
      where.eletricistaId = eletricistaId;
    }

    if (equipeId) {
      where.equipeId = equipeId;
    }

    if (dataInicio || dataFim) {
      where.dataReferencia = {};
      if (dataInicio) {
        where.dataReferencia.gte = dataInicio;
      }
      if (dataFim) {
        where.dataReferencia.lte = dataFim;
      }
    }

    if (status) {
      where.status = status;
    }

    // Adicionar busca por texto se fornecido
    if (search) {
      const searchWhere = this.buildSearchWhere(search);
      where.AND = where.AND ? [...where.AND, searchWhere] : [searchWhere];
    }

    const [items, total] = await Promise.all([
      prisma.falta.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: include || this.getDefaultInclude(),
      }),
      prisma.falta.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Retorna o include padrão para consultas
   *
   * @returns Objeto de include padrão
   */
  private getDefaultInclude() {
    return {
      eletricista: {
        select: {
          id: true,
          nome: true,
          matricula: true,
        },
      },
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
      escalaSlot: true,
      Justificativas: {
        include: {
          justificativa: {
            include: {
              tipo: true,
            },
          },
        },
      },
    };
  }

  /**
   * Constrói where para busca por texto
   *
   * @param search - Termo de busca
   * @returns Objeto where para busca
   */
  private buildSearchWhere(search: string) {
    const searchFields = this.getSearchFields();
    return {
      OR: searchFields.map(field => ({
        [field]: { contains: search },
      })),
    };
  }
}
