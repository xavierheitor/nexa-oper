/**
 * Repository para EquipeHorarioVigencia
 *
 * Gerencia acesso a dados de horários das equipes
 */

import { EquipeHorarioVigencia, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface EquipeHorarioVigenciaFilter extends PaginationParams {
  equipeId?: number;
  vigente?: boolean; // Filtrar apenas vigências ativas
}

export type EquipeHorarioVigenciaCreateInput = {
  equipeId: number;
  inicioTurnoHora: string;
  duracaoHoras: number;
  vigenciaInicio: Date;
  vigenciaFim?: Date;
};

export type EquipeHorarioVigenciaUpdateInput = Partial<EquipeHorarioVigenciaCreateInput> & {
  id: number;
};

export class EquipeHorarioVigenciaRepository extends AbstractCrudRepository<
  EquipeHorarioVigencia,
  EquipeHorarioVigenciaFilter
> {
  protected getSearchFields(): string[] {
    return ['equipe.nome'];
  }

  protected async findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<EquipeHorarioVigencia[]> {
    return prisma.equipeHorarioVigencia.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  protected async count(where: any): Promise<number> {
    return prisma.equipeHorarioVigencia.count({ where });
  }

  private toPrismaCreateData(
    data: EquipeHorarioVigenciaCreateInput,
    userId?: string
  ): Prisma.EquipeHorarioVigenciaCreateInput {
    return {
      equipe: { connect: { id: data.equipeId } },
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      vigenciaInicio: data.vigenciaInicio,
      vigenciaFim: data.vigenciaFim,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(
    data: EquipeHorarioVigenciaCreateInput,
    userId?: string
  ): Promise<EquipeHorarioVigencia> {
    return prisma.equipeHorarioVigencia.create({
      data: this.toPrismaCreateData(data, userId),
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async update(
    data: EquipeHorarioVigenciaUpdateInput,
    userId?: string
  ): Promise<EquipeHorarioVigencia> {
    const { id, ...updateData } = data;

    const prismaData: Prisma.EquipeHorarioVigenciaUpdateInput = {
      ...(updateData.equipeId && { equipe: { connect: { id: updateData.equipeId } } }),
      ...(updateData.inicioTurnoHora && { inicioTurnoHora: updateData.inicioTurnoHora }),
      ...(updateData.duracaoHoras && { duracaoHoras: updateData.duracaoHoras }),
      ...(updateData.vigenciaInicio && { vigenciaInicio: updateData.vigenciaInicio }),
      ...(updateData.vigenciaFim !== undefined && { vigenciaFim: updateData.vigenciaFim }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };

    return prisma.equipeHorarioVigencia.update({
      where: { id },
      data: prismaData,
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async findById(id: string | number): Promise<EquipeHorarioVigencia | null> {
    return prisma.equipeHorarioVigencia.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async list(params: EquipeHorarioVigenciaFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'vigenciaInicio',
      orderDir = 'desc',
      search,
      equipeId,
      vigente,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.EquipeHorarioVigenciaWhereInput = {
      deletedAt: null,
      ...(equipeId && { equipeId }),
      ...(vigente && {
        vigenciaInicio: { lte: new Date() },
        OR: [
          { vigenciaFim: null },
          { vigenciaFim: { gte: new Date() } },
        ],
      }),
      ...(search && {
        equipe: {
          nome: { contains: search },
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.equipeHorarioVigencia.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.equipeHorarioVigencia.count({ where }),
    ]);

    return { items, total };
  }

  async delete(id: string | number, userId: string): Promise<EquipeHorarioVigencia> {
    return prisma.equipeHorarioVigencia.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca o horário vigente para uma equipe em uma data específica
   */
  async findVigenteByEquipeAndData(
    equipeId: number,
    data: Date
  ): Promise<EquipeHorarioVigencia | null> {
    return prisma.equipeHorarioVigencia.findFirst({
      where: {
        equipeId,
        deletedAt: null,
        vigenciaInicio: { lte: data },
        OR: [
          { vigenciaFim: null },
          { vigenciaFim: { gte: data } },
        ],
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  /**
   * Verifica se há sobreposição de vigências para uma equipe
   */
  async verificarSobreposicao(
    equipeId: number,
    vigenciaInicio: Date,
    vigenciaFim: Date | null,
    excludeId?: number
  ): Promise<boolean> {
    const where: Prisma.EquipeHorarioVigenciaWhereInput = {
      equipeId,
      deletedAt: null,
      ...(excludeId && { id: { not: excludeId } }),
      OR: [
        // Nova vigência começa durante uma existente
        {
          vigenciaInicio: { lte: vigenciaInicio },
          OR: [
            { vigenciaFim: null },
            { vigenciaFim: { gte: vigenciaInicio } },
          ],
        },
        // Nova vigência termina durante uma existente
        ...(vigenciaFim
          ? [
              {
                vigenciaInicio: { lte: vigenciaFim },
                OR: [
                  { vigenciaFim: null },
                  { vigenciaFim: { gte: vigenciaFim } },
                ],
              },
            ]
          : []),
        // Nova vigência engloba uma existente
        ...(vigenciaFim
          ? [
              {
                vigenciaInicio: { gte: vigenciaInicio },
                vigenciaFim: { lte: vigenciaFim },
              },
            ]
          : []),
      ],
    };

    const count = await prisma.equipeHorarioVigencia.count({ where });
    return count > 0;
  }
}

