import { Prisma, ChecklistPergunta } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface ChecklistPerguntaFilter extends PaginationParams {}

export class ChecklistPerguntaRepository extends AbstractCrudRepository<
  ChecklistPergunta,
  ChecklistPerguntaFilter
> {
  create(
    data: Prisma.ChecklistPerguntaCreateInput,
    userId?: string
  ): Promise<ChecklistPergunta> {
    return prisma.checklistPergunta.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.ChecklistPerguntaUpdateInput,
    userId?: string
  ): Promise<ChecklistPergunta> {
    return prisma.checklistPergunta.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<ChecklistPergunta> {
    return prisma.checklistPergunta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<ChecklistPergunta | null> {
    return prisma.checklistPergunta.findUnique({ where: { id, deletedAt: null } });
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
  ): Promise<ChecklistPergunta[]> {
    return prisma.checklistPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.checklistPergunta.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}

