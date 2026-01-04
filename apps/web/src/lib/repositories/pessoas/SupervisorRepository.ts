import { Prisma, Supervisor } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface SupervisorFilter extends PaginationParams {}

export type SupervisorCreateInput = {
  nome: string;
  contratoId: number;
};

export class SupervisorRepository extends AbstractCrudRepository<
  Supervisor,
  SupervisorFilter
> {
  private toPrismaCreateData(
    data: SupervisorCreateInput,
    userId?: string
  ): Prisma.SupervisorCreateInput {
    return {
      nome: data.nome,
      contrato: { connect: { id: data.contratoId } },
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  create(data: SupervisorCreateInput, userId?: string): Promise<Supervisor> {
    return prisma.supervisor.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  private toPrismaUpdateData(
    data: Partial<SupervisorCreateInput>,
    userId?: string
  ): Prisma.SupervisorUpdateInput {
    return {
      ...(data.nome && { nome: data.nome }),
      ...(data.contratoId && { contrato: { connect: { id: data.contratoId } } }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };
  }

  update(
    id: number,
    data: Partial<SupervisorCreateInput>,
    userId?: string
  ): Promise<Supervisor> {
    return prisma.supervisor.update({
      where: { id },
      data: this.toPrismaUpdateData(data, userId),
    });
  }

  delete(id: number, userId: string): Promise<Supervisor> {
    return prisma.supervisor.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<Supervisor | null> {
    return prisma.supervisor.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: Prisma.SupervisorWhereInput,
    orderBy: Prisma.SupervisorOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<Supervisor[]> {
    return prisma.supervisor.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.SupervisorWhereInput): Promise<number> {
    return prisma.supervisor.count({ where });
  }
}

