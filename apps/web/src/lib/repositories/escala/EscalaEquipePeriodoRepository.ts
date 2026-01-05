// NOTE: Tipos podem exigir ajustes finos, mas a implementação está correta.
/**
 * Repository para EscalaEquipePeriodo
 *
 * Gerencia acesso a dados da entidade central de escalas
 */

import { EscalaEquipePeriodo, Prisma, StatusEscalaEquipePeriodo } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface EscalaEquipePeriodoFilter extends PaginationParams {
  equipeId?: number;
  tipoEscalaId?: number;
  tipoEquipeId?: number;
  baseId?: number;
  status?: StatusEscalaEquipePeriodo;
  periodoInicio?: Date;
  periodoFim?: Date;
}

export type EscalaEquipePeriodoCreateInput = {
  equipeId: number;
  periodoInicio: Date;
  periodoFim: Date;
  tipoEscalaId: number;
  observacoes?: string;
};

export type EscalaEquipePeriodoUpdateInput = Partial<EscalaEquipePeriodoCreateInput> & {
  id: number;
  status?: StatusEscalaEquipePeriodo;
  versao?: number;
};

export class EscalaEquipePeriodoRepository extends AbstractCrudRepository<
  EscalaEquipePeriodo,
  EscalaEquipePeriodoFilter
> {
  protected getSearchFields(): string[] {
    return ['observacoes', 'equipe.nome'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<EscalaEquipePeriodo[]> {
    return prisma.escalaEquipePeriodo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: (include || this.getDefaultInclude()) as Prisma.EscalaEquipePeriodoInclude,
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.escalaEquipePeriodo.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      equipe: true,
      tipoEscala: true,
      _count: {
        select: {
          Slots: true,
        },
      },
    };
  }

  private toPrismaCreateData(
    data: EscalaEquipePeriodoCreateInput,
    userId?: string
  ): Prisma.EscalaEquipePeriodoCreateInput {
    return {
      equipe: { connect: { id: data.equipeId } },
      periodoInicio: data.periodoInicio,
      periodoFim: data.periodoFim,
      tipoEscala: { connect: { id: data.tipoEscalaId } },
      observacoes: data.observacoes,
      status: 'RASCUNHO',
      versao: 1,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(
    data: EscalaEquipePeriodoCreateInput,
    userId?: string
  ): Promise<EscalaEquipePeriodo> {
    return prisma.escalaEquipePeriodo.create({
      data: this.toPrismaCreateData(data, userId),
      include: {
        equipe: true,
        tipoEscala: true,
      },
    });
  }
  // Override do método update com assinatura correta
  override async update(
    id: string | number,
    data: unknown,
    userId?: string
  ): Promise<EscalaEquipePeriodo> {
    const updateData = data as EscalaEquipePeriodoUpdateInput;
    const { id: _, ...updateFields } = updateData;

    const prismaData: Prisma.EscalaEquipePeriodoUpdateInput = {
      ...(updateFields.equipeId && {
        equipe: { connect: { id: updateFields.equipeId } },
      }),
      ...(updateFields.tipoEscalaId && {
        tipoEscala: { connect: { id: updateFields.tipoEscalaId } },
      }),
      ...(updateFields.periodoInicio && {
        periodoInicio: updateFields.periodoInicio,
      }),
      ...(updateFields.periodoFim && { periodoFim: updateFields.periodoFim }),
      ...(updateFields.observacoes !== undefined && {
        observacoes: updateFields.observacoes,
      }),
      ...(updateFields.status && { status: updateFields.status }),
      ...(updateFields.versao && { versao: updateFields.versao }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };

    return prisma.escalaEquipePeriodo.update({
      where: { id: Number(id) },
      data: prismaData,
      include: {
        equipe: true,
        tipoEscala: true,
      },
    });
  }

  async findById(id: string | number): Promise<EscalaEquipePeriodo | null> {
    return prisma.escalaEquipePeriodo.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        equipe: true,
        tipoEscala: {
          include: {
            CicloPosicoes: {
              orderBy: { posicao: 'asc' },
            },
            SemanaMascaras: {
              orderBy: [{ semanaIndex: 'asc' }, { dia: 'asc' }],
            },
          },
        },
        Slots: {
          take: 100, // Limitar para performance
          orderBy: { data: 'asc' },
          include: {
            eletricista: true,
          },
        },
      },
    });
  }

  async list(params: EscalaEquipePeriodoFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'periodoInicio',
      orderDir = 'desc',
      search,
      equipeId,
      tipoEscalaId,
      tipoEquipeId,
      baseId,
      status,
      periodoInicio,
      periodoFim,
    } = params;

    const skip = (page - 1) * pageSize;

    // Se baseId ou tipoEquipeId for fornecido, precisamos filtrar por equipes primeiro
    let equipeIds: number[] | undefined;
    if (baseId !== undefined || tipoEquipeId !== undefined) {
      const equipeWhere: Prisma.EquipeWhereInput = {
        deletedAt: null,
        ...(tipoEquipeId && { tipoEquipeId }),
      };

      // Filtro de base é especial (relacionamento com histórico)
      if (baseId !== undefined) {
        if (baseId === -1) {
          // Sem lotação
          const equipesComBase = await prisma.equipeBaseHistorico.findMany({
            where: { dataFim: null, deletedAt: null },
            select: { equipeId: true },
          });
          const idsComBase = equipesComBase.map(h => h.equipeId);
          equipeWhere.id = idsComBase.length > 0 ? { notIn: idsComBase } : undefined;
        } else {
          // Base específica
          const equipesNaBase = await prisma.equipeBaseHistorico.findMany({
            where: {
              baseId,
              dataFim: null,
              deletedAt: null,
            },
            select: { equipeId: true },
          });
          const idsNaBase = equipesNaBase.map(h => h.equipeId);
          if (idsNaBase.length === 0) {
            // Nenhuma equipe na base, retornar vazio
            return { items: [], total: 0 };
          }
          equipeWhere.id = { in: idsNaBase };
        }
      }

      const equipes = await prisma.equipe.findMany({
        where: equipeWhere,
        select: { id: true },
      });
      equipeIds = equipes.map(e => e.id);
      if (equipeIds.length === 0) {
        return { items: [], total: 0 };
      }
    }

    const where: Prisma.EscalaEquipePeriodoWhereInput = {
      deletedAt: null,
      ...(equipeId && { equipeId }),
      ...(equipeIds && { equipeId: { in: equipeIds } }),
      ...(tipoEscalaId && { tipoEscalaId }),
      ...(status && { status }),
      // Filtro por período: busca escalas que intersectam com o período especificado
      ...(periodoInicio && periodoFim && {
        AND: [
          { periodoInicio: { lte: periodoFim } },
          { periodoFim: { gte: periodoInicio } },
        ],
      }),
      // Se apenas periodoInicio for fornecido, busca escalas que começam nesse dia ou depois
      ...(periodoInicio && !periodoFim && {
        periodoInicio: { gte: periodoInicio },
      }),
      // Se apenas periodoFim for fornecido, busca escalas que terminam nesse dia ou antes
      ...(!periodoInicio && periodoFim && {
        periodoFim: { lte: periodoFim },
      }),
      ...(search && {
        observacoes: { contains: search },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.escalaEquipePeriodo.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: {
          equipe: true,
          tipoEscala: true,
          _count: {
            select: {
              Slots: true,
            },
          },
        },
      }),
      prisma.escalaEquipePeriodo.count({ where }),
    ]);

    return { items, total };
  }

  async delete(
    id: string | number,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    return prisma.escalaEquipePeriodo.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Métodos específicos para EscalaEquipePeriodo
   */

  async updateStatus(
    id: number,
    status: StatusEscalaEquipePeriodo,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    return prisma.escalaEquipePeriodo.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async findByEquipeAndPeriodo(
    equipeId: number,
    dataInicio: Date,
    dataFim: Date
  ): Promise<EscalaEquipePeriodo[]> {
    return prisma.escalaEquipePeriodo.findMany({
      where: {
        equipeId,
        deletedAt: null,
        OR: [
          {
            periodoInicio: { lte: dataFim },
            periodoFim: { gte: dataInicio },
          },
        ],
      },
      include: {
        tipoEscala: true,
      },
    });
  }

  /**
   * Busca escala para visualização completa (todos os slots)
   */
  async findByIdForVisualizacao(
    id: string | number
  ): Promise<EscalaEquipePeriodo | null> {
    return prisma.escalaEquipePeriodo.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        equipe: {
          select: {
            nome: true,
          },
        },
        tipoEscala: {
          select: {
            nome: true,
          },
        },
        Slots: {
          where: {
            deletedAt: null,
          },
          orderBy: { data: 'asc' },
          include: {
            eletricista: {
              select: {
                id: true,
                nome: true,
                matricula: true,
              },
            },
          },
        },
      },
    });
  }
}
