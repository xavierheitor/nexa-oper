/**
 * Repositório para Horas Extras
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade HoraExtra, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Filtros por eletricista, equipe, data, status e tipo
 * - Conversão automática de Decimal para number
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new HoraExtraRepository();
 * const horasExtras = await repository.list({ page: 1, pageSize: 10 });
 * const horaExtra = await repository.findById(1);
 * ```
 */

import { HoraExtra, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface HoraExtraFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  tipo?: string;
}

export class HoraExtraRepository extends AbstractCrudRepository<
  HoraExtra,
  HoraExtraFilter
> {
  /**
   * Cria uma nova hora extra
   *
   * @param data - Dados da hora extra
   * @returns Hora extra criada
   */
  async create(data: Prisma.HoraExtraCreateInput): Promise<HoraExtra> {
    const horaExtra = await prisma.horaExtra.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });

    return this.serializeDecimalFields(horaExtra);
  }

  /**
   * Atualiza uma hora extra existente
   *
   * @param id - ID da hora extra
   * @param data - Dados para atualização
   * @returns Hora extra atualizada
   */
  async update(id: number | string, data: Prisma.HoraExtraUpdateInput): Promise<HoraExtra> {
    const horaExtra = await prisma.horaExtra.update({
      where: { id: Number(id) },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });

    return this.serializeDecimalFields(horaExtra);
  }

  /**
   * Exclui uma hora extra (hard delete)
   *
   * NOTA: Horas extras são registros históricos e normalmente não devem ser deletadas.
   * Este método existe apenas para completar a interface do repositório.
   *
   * @param id - ID da hora extra
   * @param userId - ID do usuário que está excluindo (não usado, mas requerido pela interface)
   * @returns Hora extra excluída
   */
  async delete(id: number | string, userId: string): Promise<HoraExtra> {
    return prisma.horaExtra.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Busca uma hora extra por ID
   *
   * @param id - ID da hora extra
   * @returns Hora extra encontrada ou null
   */
  async findById(id: number | string): Promise<HoraExtra | null> {
    const horaExtra = await prisma.horaExtra.findUnique({
      where: { id: Number(id) },
      include: this.getDefaultInclude(),
    });

    if (!horaExtra) {
      return null;
    }

    return this.serializeDecimalFields(horaExtra);
  }

  /**
   * Define quais campos podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['observacoes'];
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
  ): Promise<HoraExtra[]> {
    const items = await prisma.horaExtra.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });

    // Converter campos Decimal para number
    return items.map(item => this.serializeDecimalFields(item));
  }

  /**
   * Executa a consulta count no ORM
   *
   * @param where - Condições de filtro
   * @returns Número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.horaExtra.count({ where });
  }

  /**
   * Lista horas extras com filtros e paginação
   *
   * Sobrescreve o método base para adicionar suporte a filtros customizados
   */
  async list(params: HoraExtraFilter): Promise<{ items: HoraExtra[]; total: number }> {
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
      tipo,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros customizados
    const where: any = {};

    if (eletricistaId) {
      where.eletricistaId = eletricistaId;
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

    if (tipo) {
      where.tipo = tipo;
    }

    // Se filtrar por equipe, precisamos filtrar por turnos da equipe
    if (equipeId) {
      where.turnoRealizadoEletricista = {
        turnoRealizado: {
          equipeId,
        },
      };
    }

    // Adicionar busca por texto se fornecido
    if (search) {
      const searchWhere = this.buildSearchWhere(search);
      where.AND = where.AND ? [...where.AND, searchWhere] : [searchWhere];
    }

    const [items, total] = await Promise.all([
      prisma.horaExtra.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: include || this.getDefaultInclude(),
      }),
      prisma.horaExtra.count({ where }),
    ]);

    // Converter campos Decimal para number
    const itemsSerializados = items.map(item => this.serializeDecimalFields(item));

    return { items: itemsSerializados, total };
  }

  /**
   * Atualiza status de hora extra (aprovar/rejeitar)
   *
   * @param id - ID da hora extra
   * @param status - Novo status ('aprovada' | 'rejeitada')
   * @param updatedBy - ID do usuário que está atualizando
   * @returns Hora extra atualizada
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', updatedBy: string): Promise<HoraExtra> {
    const horaExtra = await prisma.horaExtra.update({
      where: { id },
      data: {
        status,
        updatedBy,
        updatedAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });

    return this.serializeDecimalFields(horaExtra);
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
      turnoRealizadoEletricista: {
        include: {
          turnoRealizado: {
            select: {
              id: true,
              equipeId: true,
              equipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      },
      escalaSlot: true,
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

  /**
   * Serializa campos Decimal para number (React não serializa Decimal)
   *
   * @param item - Item com campos Decimal
   * @returns Item com campos Decimal convertidos para number
   */
  private serializeDecimalFields(item: any): HoraExtra {
    return {
      ...item,
      horasPrevistas: item.horasPrevistas ? Number(item.horasPrevistas) : null,
      horasRealizadas: Number(item.horasRealizadas),
      diferencaHoras: Number(item.diferencaHoras),
    } as HoraExtra;
  }
}
