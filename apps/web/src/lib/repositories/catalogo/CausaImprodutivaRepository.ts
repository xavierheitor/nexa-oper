import { CausaImprodutiva, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface CausaImprodutivaFilter extends PaginationParams {
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

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

  protected buildCustomFilters(
    params: CausaImprodutivaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };
    const createdAtFilter: Partial<Record<'gte' | 'lte', Date>> = {};

    if (params.dataInicio) {
      const inicio = new Date(params.dataInicio);
      inicio.setHours(0, 0, 0, 0);
      createdAtFilter.gte = inicio;
    }

    if (params.dataFim) {
      const fim = new Date(params.dataFim);
      fim.setHours(23, 59, 59, 999);
      createdAtFilter.lte = fim;
    }

    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    return where;
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
