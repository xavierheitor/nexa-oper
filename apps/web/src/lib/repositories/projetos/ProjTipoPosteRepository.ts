import { Prisma, ProjTipoPoste } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface ProjTipoPosteFilter extends PaginationParams {}

export class ProjTipoPosteRepository extends AbstractCrudRepository<
  ProjTipoPoste,
  ProjTipoPosteFilter
> {
  create(
    data: Prisma.ProjTipoPosteCreateInput,
    userId?: string
  ): Promise<ProjTipoPoste> {
    return prisma.projTipoPoste.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
    });
  }

  update(
    id: number,
    data: Prisma.ProjTipoPosteUpdateInput,
    userId?: string
  ): Promise<ProjTipoPoste> {
    return prisma.projTipoPoste.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<ProjTipoPoste> {
    return prisma.projTipoPoste.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<ProjTipoPoste | null> {
    return prisma.projTipoPoste.findUnique({
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
  ): Promise<ProjTipoPoste[]> {
    return prisma.projTipoPoste.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projTipoPoste.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
