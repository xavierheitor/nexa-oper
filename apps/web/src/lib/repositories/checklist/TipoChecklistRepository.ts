import { Prisma, TipoChecklist } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface Filter extends PaginationParams {}

export class TipoChecklistRepository extends AbstractCrudRepository<
  TipoChecklist,
  Filter
> {
  create(
    data: Prisma.TipoChecklistCreateInput,
    userId?: string
  ): Promise<TipoChecklist> {
    return prisma.tipoChecklist.create({
      data: {
        ...data,
        createdAt: new Date(),
        createdBy: userId || '',
      },
      include: this.getDefaultInclude(),
    });
  }

  update(
    id: number,
    data: Prisma.TipoChecklistUpdateInput,
    userId?: string
  ): Promise<TipoChecklist> {
    return prisma.tipoChecklist.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
      include: this.getDefaultInclude(),
    });
  }

  delete(id: number, userId: string): Promise<TipoChecklist> {
    return prisma.tipoChecklist.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: this.getDefaultInclude(),
    });
  }

  findById(id: number): Promise<TipoChecklist | null> {
    return prisma.tipoChecklist.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
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
  ): Promise<TipoChecklist[]> {
    return prisma.tipoChecklist.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoChecklist.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
