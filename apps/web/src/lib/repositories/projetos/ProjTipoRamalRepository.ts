import { Prisma, ProjTipoRamal } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface ProjTipoRamalFilter extends PaginationParams {}

export class ProjTipoRamalRepository extends AbstractCrudRepository<
  ProjTipoRamal,
  ProjTipoRamalFilter
> {
  create(
    data: Prisma.ProjTipoRamalCreateInput,
    userId?: string
  ): Promise<ProjTipoRamal> {
    return prisma.projTipoRamal.create({
      data: {
        ...data,
        createdBy: userId ?? '',
        createdAt: new Date(),
      },
    });
  }

  update(
    id: number,
    data: Prisma.ProjTipoRamalUpdateInput,
    userId?: string
  ): Promise<ProjTipoRamal> {
    return prisma.projTipoRamal.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ?? '',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<ProjTipoRamal> {
    return prisma.projTipoRamal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<ProjTipoRamal | null> {
    return prisma.projTipoRamal.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjTipoRamal[]> {
    return prisma.projTipoRamal.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? this.getDefaultInclude(),
    });
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projTipoRamal.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
