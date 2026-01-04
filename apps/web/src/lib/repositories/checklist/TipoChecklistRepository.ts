import { Prisma, TipoChecklist } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

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
    });
  }

  delete(id: number, userId: string): Promise<TipoChecklist> {
    return prisma.tipoChecklist.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<TipoChecklist | null> {
    return prisma.tipoChecklist.findUnique({ where: { id, deletedAt: null } as any });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: Prisma.TipoChecklistWhereInput,
    orderBy: Prisma.TipoChecklistOrderByWithRelationInput,
    skip: number,
    take: number
  ): Promise<TipoChecklist[]> {
    return prisma.tipoChecklist.findMany({ where, orderBy, skip, take });
  }
  protected count(where: Prisma.TipoChecklistWhereInput): Promise<number> {
    return prisma.tipoChecklist.count({ where });
  }
}
