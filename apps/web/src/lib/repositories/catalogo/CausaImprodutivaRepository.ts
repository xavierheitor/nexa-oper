import { CausaImprodutiva, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface CausaImprodutivaFilter extends PaginationParams {}

export class CausaImprodutivaRepository extends AbstractCrudRepository<
  CausaImprodutiva,
  CausaImprodutivaFilter
> {
  create(
    data: Prisma.CausaImprodutivaCreateInput,
    userId?: string
  ): Promise<CausaImprodutiva> {
    return prisma.causaImprodutiva.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.CausaImprodutivaUpdateInput,
    userId?: string
  ): Promise<CausaImprodutiva> {
    return prisma.causaImprodutiva.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<CausaImprodutiva> {
    return prisma.causaImprodutiva.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<CausaImprodutiva | null> {
    return prisma.causaImprodutiva.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields(): string[] {
    return ['causa'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    _include?: GenericPrismaIncludeInput
  ): Promise<CausaImprodutiva[]> {
    return prisma.causaImprodutiva.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.causaImprodutiva.count({ where });
  }
}
