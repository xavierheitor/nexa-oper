import { Prisma, ProjTipoEstrutura } from '@nexa-oper/db';
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
  ProjTipoEstrutura,
  ProjTipoEstruturaFilter
> {
  create(
    data: Prisma.ProjTipoEstruturaCreateInput,
    userId?: string
  ): Promise<ProjTipoEstrutura> {
    return prisma.projTipoEstrutura.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  update(
    id: number,
    data: Prisma.ProjTipoEstruturaUpdateInput,
    userId?: string
  ): Promise<ProjTipoEstrutura> {
    return prisma.projTipoEstrutura.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<ProjTipoEstrutura> {
    return prisma.projTipoEstrutura.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<ProjTipoEstrutura | null> {
    return prisma.projTipoEstrutura.findUnique({
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
  ): Promise<ProjTipoEstrutura[]> {
    return prisma.projTipoEstrutura.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projTipoEstrutura.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
