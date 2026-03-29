import { Prisma, ProjProjeto } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

const projProjetoInclude = {
  programa: {
    include: {
      contrato: true,
    },
  },
} satisfies Prisma.ProjProjetoInclude;

export type ProjProjetoListItem = Prisma.ProjProjetoGetPayload<{
  include: typeof projProjetoInclude;
}>;

interface ProjProjetoFilter extends PaginationParams {
  contratoId?: number;
  programaId?: number;
  status?: ProjProjeto['status'];
}

export class ProjProjetoRepository extends AbstractCrudRepository<
  ProjProjetoListItem,
  ProjProjetoFilter
> {
  create(
    data: Prisma.ProjProjetoCreateInput,
    userId?: string
  ): Promise<ProjProjetoListItem> {
    return prisma.projProjeto.create({
      data: {
        ...data,
        createdBy: userId ?? '',
        createdAt: new Date(),
      },
      include: projProjetoInclude,
    });
  }

  update(
    id: number,
    data: Prisma.ProjProjetoUpdateInput,
    userId?: string
  ): Promise<ProjProjetoListItem> {
    return prisma.projProjeto.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ?? '',
        updatedAt: new Date(),
      },
      include: projProjetoInclude,
    });
  }

  delete(id: number, userId: string): Promise<ProjProjetoListItem> {
    return prisma.projProjeto.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: projProjetoInclude,
    });
  }

  findById(id: number): Promise<ProjProjetoListItem | null> {
    return prisma.projProjeto.findUnique({
      where: { id, deletedAt: null },
      include: projProjetoInclude,
    });
  }

  protected getSearchFields(): string[] {
    return ['numeroProjeto', 'descricao', 'equipamento', 'municipio'];
  }

  protected buildCustomFilters(
    params: ProjProjetoFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.programaId) {
      where.programaId = params.programaId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.contratoId) {
      where.programa = {
        is: {
          contratoId: params.contratoId,
        },
      };
    }

    return where;
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjProjetoListItem[]> {
    return prisma.projProjeto.findMany({
      where,
      orderBy,
      skip,
      take,
      include:
        (include as Prisma.ProjProjetoInclude | undefined) ?? projProjetoInclude,
    }) as Promise<ProjProjetoListItem[]>;
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projProjeto.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return projProjetoInclude;
  }
}
