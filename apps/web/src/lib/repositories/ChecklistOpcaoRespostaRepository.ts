import { Prisma, ChecklistOpcaoResposta } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface ChecklistOpcaoRespostaFilter extends PaginationParams {}

export class ChecklistOpcaoRespostaRepository extends AbstractCrudRepository<
  ChecklistOpcaoResposta,
  ChecklistOpcaoRespostaFilter
> {
  create(
    data: Prisma.ChecklistOpcaoRespostaCreateInput,
    userId?: string
  ): Promise<ChecklistOpcaoResposta> {
    return prisma.checklistOpcaoResposta.create({
      data: {
        ...data,
        createdAt: new Date(),
        createdBy: userId || '',
      },
    });
  }

  update(
    id: number,
    data: Prisma.ChecklistOpcaoRespostaUpdateInput,
    userId?: string
  ): Promise<ChecklistOpcaoResposta> {
    return prisma.checklistOpcaoResposta.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  delete(id: number, userId: string): Promise<ChecklistOpcaoResposta> {
    return prisma.checklistOpcaoResposta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<ChecklistOpcaoResposta | null> {
    return prisma.checklistOpcaoResposta.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: Prisma.ChecklistOpcaoRespostaWhereInput,
    orderBy: Prisma.ChecklistOpcaoRespostaOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<ChecklistOpcaoResposta[]> {
    return prisma.checklistOpcaoResposta.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.ChecklistOpcaoRespostaWhereInput): Promise<number> {
    return prisma.checklistOpcaoResposta.count({ where });
  }
}

