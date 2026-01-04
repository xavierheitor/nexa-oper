import { Prisma, EquipeSupervisor } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface EquipeSupervisorFilter extends PaginationParams {}

export type EquipeSupervisorCreateInput = {
  supervisorId: number;
  equipeId: number;
  inicio: Date;
  fim?: Date | null;
};

export class EquipeSupervisorRepository extends AbstractCrudRepository<
  EquipeSupervisor,
  EquipeSupervisorFilter
> {
  private toPrismaCreateData(
    data: EquipeSupervisorCreateInput,
    userId?: string
  ): Prisma.EquipeSupervisorCreateInput {
    return {
      supervisor: { connect: { id: data.supervisorId } },
      equipe: { connect: { id: data.equipeId } },
      inicio: data.inicio,
      ...(data.fim !== undefined ? { fim: data.fim } : {}),
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  create(
    data: EquipeSupervisorCreateInput,
    userId?: string
  ): Promise<EquipeSupervisor> {
    return prisma.equipeSupervisor.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  private toPrismaUpdateData(
    data: Partial<EquipeSupervisorCreateInput>,
    userId?: string
  ): Prisma.EquipeSupervisorUpdateInput {
    return {
      ...(data.supervisorId && {
        supervisor: { connect: { id: data.supervisorId } },
      }),
      ...(data.equipeId && { equipe: { connect: { id: data.equipeId } } }),
      ...(data.inicio && { inicio: data.inicio }),
      ...(data.fim !== undefined ? { fim: data.fim ?? null } : {}),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };
  }

  update(
    id: number,
    data: Partial<EquipeSupervisorCreateInput>,
    userId?: string
  ): Promise<EquipeSupervisor> {
    return prisma.equipeSupervisor.update({
      where: { id },
      data: this.toPrismaUpdateData(data, userId),
    });
  }

  delete(id: number, userId: string): Promise<EquipeSupervisor> {
    return prisma.equipeSupervisor.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<EquipeSupervisor | null> {
    return prisma.equipeSupervisor.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields(): string[] {
    return []; // busca textual não aplicável diretamente
  }

  protected findMany(
    where: Prisma.EquipeSupervisorWhereInput,
    orderBy: Prisma.EquipeSupervisorOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<EquipeSupervisor[]> {
    return prisma.equipeSupervisor.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.EquipeSupervisorWhereInput): Promise<number> {
    return prisma.equipeSupervisor.count({ where });
  }
}

