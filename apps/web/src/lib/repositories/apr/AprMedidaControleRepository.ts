import { AprMedidaControle, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface AprMedidaControleFilter extends PaginationParams {}

export class AprMedidaControleRepository extends AbstractCrudRepository<
  AprMedidaControle,
  AprMedidaControleFilter
> {
  create(
    data: Prisma.AprMedidaControleCreateInput,
    _userId?: string
  ): Promise<AprMedidaControle> {
    return prisma.aprMedidaControle.create({ data });
  }

  update(
    id: number,
    data: Prisma.AprMedidaControleUpdateInput,
    userId?: string
  ): Promise<AprMedidaControle> {
    return prisma.aprMedidaControle.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<AprMedidaControle> {
    return prisma.aprMedidaControle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<AprMedidaControle | null> {
    return prisma.aprMedidaControle.findUnique({
      where: { id, deletedAt: null },
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
  ): Promise<AprMedidaControle[]> {
    return prisma.aprMedidaControle.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.aprMedidaControle.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
