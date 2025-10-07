/**
 * Repository para EscalaEquipePeriodo
 *
 * Gerencia acesso a dados da entidade central de escalas
 */

import { EscalaEquipePeriodo, Prisma, StatusEscalaEquipePeriodo } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface EscalaEquipePeriodoFilter extends PaginationParams {
  equipeId?: number;
  tipoEscalaId?: number;
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

  async update(
    data: EscalaEquipePeriodoUpdateInput,
    userId?: string
  ): Promise<EscalaEquipePeriodo> {
    const { id, ...updateData } = data;

    const prismaData: Prisma.EscalaEquipePeriodoUpdateInput = {
      ...(updateData.equipeId && { equipe: { connect: { id: updateData.equipeId } } }),
      ...(updateData.tipoEscalaId && { tipoEscala: { connect: { id: updateData.tipoEscalaId } } }),
      ...(updateData.periodoInicio && { periodoInicio: updateData.periodoInicio }),
      ...(updateData.periodoFim && { periodoFim: updateData.periodoFim }),
      ...(updateData.observacoes !== undefined && { observacoes: updateData.observacoes }),
      ...(updateData.status && { status: updateData.status }),
      ...(updateData.versao && { versao: updateData.versao }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };

    return prisma.escalaEquipePeriodo.update({
      where: { id },
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
            CicloPosicoes: true,
            SemanaMascaras: true,
            ComposicaoPorPapel: {
              include: {
                papel: true,
              },
            },
          },
        },
        ComposicaoOverride: {
          include: {
            papel: true,
          },
        },
        Slots: {
          take: 100, // Limitar para performance
          orderBy: { data: 'asc' },
          include: {
            Atribuicoes: {
              include: {
                eletricista: true,
                papel: true,
              },
            },
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
      status,
      periodoInicio,
      periodoFim,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.EscalaEquipePeriodoWhereInput = {
      deletedAt: null,
      ...(equipeId && { equipeId }),
      ...(tipoEscalaId && { tipoEscalaId }),
      ...(status && { status }),
      ...(periodoInicio && {
        periodoInicio: { gte: periodoInicio },
      }),
      ...(periodoFim && {
        periodoFim: { lte: periodoFim },
      }),
      ...(search && {
        observacoes: { contains: search, mode: 'insensitive' },
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

  async delete(id: string | number, userId: string): Promise<EscalaEquipePeriodo> {
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
}

