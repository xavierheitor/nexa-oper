// NOTE: Tipos podem exigir ajustes finos, mas a implementação está correta.
/**
 * Repository para EquipeTurnoHistorico
 *
 * Gerencia associação de equipes a horários com vigência temporal
 */

import { EquipeTurnoHistorico, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface EquipeTurnoHistoricoFilter extends PaginationParams {
  equipeId?: number;
  vigente?: boolean;
}

export type EquipeTurnoHistoricoCreateInput = {
  equipeId: number;
  horarioAberturaCatalogoId?: number;
  dataInicio: Date;
  dataFim?: Date;
  inicioTurnoHora: string;
  duracaoHoras: number;
  duracaoIntervaloHoras?: number;
  motivo?: string;
  observacoes?: string;
};

export type EquipeTurnoHistoricoUpdateInput = Partial<EquipeTurnoHistoricoCreateInput> & {
  id: number;
};

export class EquipeTurnoHistoricoRepository extends AbstractCrudRepository<
  EquipeTurnoHistorico,
  EquipeTurnoHistoricoFilter
> {
  protected getSearchFields(): string[] {
    return ['equipe.nome', 'motivo'];
  }

  protected async findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<EquipeTurnoHistorico[]> {
    return prisma.equipeTurnoHistorico.findMany({
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
        horarioAberturaCatalogo: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  protected async count(where: any): Promise<number> {
    return prisma.equipeTurnoHistorico.count({ where });
  }

  private toPrismaCreateData(
    data: EquipeTurnoHistoricoCreateInput,
    userId?: string
  ): Prisma.EquipeTurnoHistoricoCreateInput {
    // Calcular fimTurnoHora (duração + intervalo)
    const [horas, minutos, segundos] = data.inicioTurnoHora
      .split(':')
      .map(Number);
    const duracaoTotal = data.duracaoHoras + (data.duracaoIntervaloHoras || 0);
    const totalMinutos = horas * 60 + minutos + duracaoTotal * 60;
    const horasFim = Math.floor(totalMinutos / 60) % 24;
    const minutosFim = totalMinutos % 60;
    const fimTurnoHora = `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    return {
      equipe: { connect: { id: data.equipeId } },
      ...(data.horarioAberturaCatalogoId && {
        horarioAberturaCatalogo: {
          connect: { id: data.horarioAberturaCatalogoId },
        },
      }),
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      duracaoIntervaloHoras: data.duracaoIntervaloHoras || 0,
      fimTurnoHora,
      motivo: data.motivo,
      observacoes: data.observacoes,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(
    data: EquipeTurnoHistoricoCreateInput,
    userId?: string
  ): Promise<EquipeTurnoHistorico> {
    return prisma.equipeTurnoHistorico.create({
      data: this.toPrismaCreateData(data, userId),
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        horarioAberturaCatalogo: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }
  // Override do método update com assinatura correta
  override async update(
    id: string | number,
    data: unknown,
    userId?: string
  ): Promise<EquipeTurnoHistorico> {
    const updateData = data as EquipeTurnoHistoricoUpdateInput;
    const { id: _, ...updateFields } = updateData;

    // Recalcular fimTurnoHora se necessário (duração + intervalo)
    let fimTurnoHora: string | undefined;
    if (updateFields.inicioTurnoHora && updateFields.duracaoHoras) {
      const [horas, minutos, segundos] = updateFields.inicioTurnoHora
        .split(':')
        .map(Number);
      const duracaoTotal =
        updateFields.duracaoHoras + (updateFields.duracaoIntervaloHoras || 0);
      const totalMinutos = horas * 60 + minutos + duracaoTotal * 60;
      const horasFim = Math.floor(totalMinutos / 60) % 24;
      const minutosFim = totalMinutos % 60;
      fimTurnoHora = `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }

    const prismaData: Prisma.EquipeTurnoHistoricoUpdateInput = {
      ...(updateFields.equipeId && {
        equipe: { connect: { id: updateFields.equipeId } },
      }),
      ...(updateFields.horarioAberturaCatalogoId && {
        horarioAberturaCatalogo: {
          connect: { id: updateFields.horarioAberturaCatalogoId },
        },
      }),
      ...(updateFields.dataInicio && { dataInicio: updateFields.dataInicio }),
      ...(updateFields.dataFim !== undefined && { dataFim: updateFields.dataFim }),
      ...(updateFields.inicioTurnoHora && {
        inicioTurnoHora: updateFields.inicioTurnoHora,
      }),
      ...(updateFields.duracaoHoras && { duracaoHoras: updateFields.duracaoHoras }),
      ...(updateFields.duracaoIntervaloHoras !== undefined && {
        duracaoIntervaloHoras: updateFields.duracaoIntervaloHoras,
      }),
      ...(fimTurnoHora && { fimTurnoHora }),
      ...(updateFields.motivo !== undefined && { motivo: updateFields.motivo }),
      ...(updateFields.observacoes !== undefined && {
        observacoes: updateFields.observacoes,
      }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };

    return prisma.equipeTurnoHistorico.update({
      where: { id: Number(id) },
      data: prismaData,
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        horarioAberturaCatalogo: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async findById(id: string | number): Promise<EquipeTurnoHistorico | null> {
    return prisma.equipeTurnoHistorico.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        horarioAberturaCatalogo: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async list(params: EquipeTurnoHistoricoFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'dataInicio',
      orderDir = 'desc',
      search,
      equipeId,
      vigente,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.EquipeTurnoHistoricoWhereInput = {
      deletedAt: null,
      ...(equipeId && { equipeId }),
      ...(vigente && {
        dataInicio: { lte: new Date() },
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ],
      }),
      ...(search && {
        equipe: {
          nome: { contains: search },
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.equipeTurnoHistorico.findMany({
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
          horarioAberturaCatalogo: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma.equipeTurnoHistorico.count({ where }),
    ]);

    return { items, total };
  }

  async delete(id: string | number, userId: string): Promise<EquipeTurnoHistorico> {
    return prisma.equipeTurnoHistorico.update({
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
  ): Promise<EquipeTurnoHistorico | null> {
    return prisma.equipeTurnoHistorico.findFirst({
      where: {
        equipeId,
        deletedAt: null,
        dataInicio: { lte: data },
        OR: [
          { dataFim: null },
          { dataFim: { gte: data } },
        ],
      },
      orderBy: { dataInicio: 'desc' },
      include: {
        horarioAberturaCatalogo: true,
      },
    });
  }

  /**
   * Verifica se há sobreposição de períodos para uma equipe
   */
  async verificarSobreposicao(
    equipeId: number,
    dataInicio: Date,
    dataFim: Date | null,
    excludeId?: number
  ): Promise<boolean> {
    const where: Prisma.EquipeTurnoHistoricoWhereInput = {
      equipeId,
      deletedAt: null,
      ...(excludeId && { id: { not: excludeId } }),
      OR: [
        {
          dataInicio: { lte: dataInicio },
          OR: [
            { dataFim: null },
            { dataFim: { gte: dataInicio } },
          ],
        },
        ...(dataFim
          ? [
              {
                dataInicio: { lte: dataFim },
                OR: [
                  { dataFim: null },
                  { dataFim: { gte: dataFim } },
                ],
              },
            ]
          : []),
      ],
    };

    const count = await prisma.equipeTurnoHistorico.count({ where });
    return count > 0;
  }
}
