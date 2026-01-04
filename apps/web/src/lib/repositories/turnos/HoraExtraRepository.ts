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
  async update(
    id: number | string,
    data: Prisma.HoraExtraUpdateInput
  ): Promise<HoraExtra> {
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
   * Constrói filtros customizados a partir dos parâmetros
   *
   * Implementa filtros específicos de HoraExtra: eletricistaId, equipeId, dataInicio, dataFim, status, tipo
   *
   * @param params - Parâmetros de filtro
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   */
  protected buildCustomFilters(
    params: HoraExtraFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where: Prisma.HoraExtraWhereInput = {
      ...(baseWhere as Prisma.HoraExtraWhereInput),
    };

    // Filtro por eletricista
    if (params.eletricistaId) {
      where.eletricistaId = params.eletricistaId;
    }

    // Filtro por range de datas
    if (params.dataInicio || params.dataFim) {
      where.dataReferencia = {};
      if (params.dataInicio) {
        where.dataReferencia.gte = params.dataInicio;
      }
      if (params.dataFim) {
        where.dataReferencia.lte = params.dataFim;
      }
    }

    // Filtro por status
    if (params.status) {
      where.status = params.status;
    }

    // Filtro por tipo
    if (params.tipo) {
      where.tipo = params.tipo;
    }

    // Se filtrar por equipe, precisamos filtrar por turnos da equipe
    if (params.equipeId) {
      where.turnoRealizadoEletricista = {
        turnoRealizado: {
          equipeId: params.equipeId,
        },
      };
    }

    return where;
  }

  /**
   * Verifica se o modelo tem soft delete
   *
   * HoraExtra não tem soft delete no schema
   */
  protected hasSoftDelete(): boolean {
    return false;
  }

  /**
   * Atualiza status de hora extra (aprovar/rejeitar)
   *
   * @param id - ID da hora extra
   * @param status - Novo status ('aprovada' | 'rejeitada')
   * @param updatedBy - ID do usuário que está atualizando
   * @returns Hora extra atualizada
   */
  async updateStatus(
    id: number,
    status: 'aprovada' | 'rejeitada',
    updatedBy: string
  ): Promise<HoraExtra> {
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
   * @returns Objeto de include padrão tipado com GenericPrismaIncludeInput
   */
  protected getDefaultInclude(): GenericPrismaIncludeInput {
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
   * Serializa campos Decimal para number (React não serializa Decimal)
   *
   * @param item - Item com campos Decimal (pode ser do tipo Prisma com Decimal)
   * @returns Item com campos Decimal convertidos para number
   */
  private serializeDecimalFields(item: unknown): HoraExtra {
    // @ts-expect-error - Conversão intencional: item pode ter Decimal do Prisma, convertemos para number
    const typedItem: Record<string, unknown> = item;

    const serialized: Record<string, unknown> = {
      ...typedItem,
      horasPrevistas: typedItem.horasPrevistas
        ? Number(typedItem.horasPrevistas)
        : null,
      horasRealizadas: Number(typedItem.horasRealizadas),
      diferencaHoras: Number(typedItem.diferencaHoras),
    };

    // Cast necessário porque HoraExtra do Prisma usa Decimal, mas serializamos para number
    // Esta conversão é segura porque estamos apenas mudando o tipo para serialização
    return serialized as HoraExtra;
  }
}
