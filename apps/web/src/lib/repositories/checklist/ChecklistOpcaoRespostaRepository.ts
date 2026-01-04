import { Prisma, ChecklistOpcaoResposta } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

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

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ChecklistOpcaoResposta[]> {
    return prisma.checklistOpcaoResposta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.checklistOpcaoResposta.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}

