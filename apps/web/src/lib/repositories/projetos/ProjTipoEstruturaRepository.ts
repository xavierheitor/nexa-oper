import { Prisma, ProjEstrutura } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface ProjTipoEstruturaFilter extends PaginationParams {}

export class ProjTipoEstruturaRepository extends AbstractCrudRepository<
  ProjEstrutura,
  ProjTipoEstruturaFilter
> {
  create(
    data: Prisma.ProjEstruturaCreateInput,
    userId?: string
  ): Promise<ProjEstrutura> {
    return prisma.projEstrutura.create({
      data: {
        ...data,
        createdBy: userId ?? '',
        createdAt: new Date(),
      },
    });
  }

  update(
    id: number,
    data: Prisma.ProjEstruturaUpdateInput,
    userId?: string
  ): Promise<ProjEstrutura> {
    return prisma.projEstrutura.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ?? '',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<ProjEstrutura> {
    return prisma.projEstrutura.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<ProjEstrutura | null> {
    return prisma.projEstrutura.findUnique({
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
  ): Promise<ProjEstrutura[]> {
    return prisma.projEstrutura.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projEstrutura.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
