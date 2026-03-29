import { Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

const projProgramaInclude = {
  contrato: true,
} satisfies Prisma.ProjProgramaInclude;

export type ProjProgramaListItem = Prisma.ProjProgramaGetPayload<{
  include: typeof projProgramaInclude;
}>;

interface ProjProgramaFilter extends PaginationParams {
  contratoId?: number;
}

export class ProjProgramaRepository extends AbstractCrudRepository<
  ProjProgramaListItem,
  ProjProgramaFilter
> {
  create(
    data: Prisma.ProjProgramaCreateInput,
    userId?: string
  ): Promise<ProjProgramaListItem> {
    return prisma.projPrograma.create({
      data: {
        ...data,
        createdBy: userId ?? '',
        createdAt: new Date(),
      },
      include: projProgramaInclude,
    });
  }

  update(
    id: number,
    data: Prisma.ProjProgramaUpdateInput,
    userId?: string
  ): Promise<ProjProgramaListItem> {
    return prisma.projPrograma.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ?? '',
        updatedAt: new Date(),
      },
      include: projProgramaInclude,
    });
  }

  delete(id: number, userId: string): Promise<ProjProgramaListItem> {
    return prisma.projPrograma.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: projProgramaInclude,
    });
  }

  findById(id: number): Promise<ProjProgramaListItem | null> {
    return prisma.projPrograma.findUnique({
      where: { id, deletedAt: null },
      include: projProgramaInclude,
    });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected buildCustomFilters(
    params: ProjProgramaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.contratoId) {
      where.contratoId = params.contratoId;
    }

    return where;
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjProgramaListItem[]> {
    return prisma.projPrograma.findMany({
      where,
      orderBy,
      skip,
      take,
      include:
        (include as Prisma.ProjProgramaInclude | undefined) ??
        projProgramaInclude,
    }) as Promise<ProjProgramaListItem[]>;
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projPrograma.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return projProgramaInclude;
  }
}
