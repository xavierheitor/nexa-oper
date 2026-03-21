import { Prisma, ProjetoProgramacao } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

const projetoProgramacaoInclude = {
  contrato: true,
} satisfies Prisma.ProjetoProgramacaoInclude;

export type ProjetoProgramacaoListItem = Prisma.ProjetoProgramacaoGetPayload<{
  include: typeof projetoProgramacaoInclude;
}>;

interface ProjetoProgramacaoFilter extends PaginationParams {
  contratoId?: number;
  status?: ProjetoProgramacao['status'];
}

export class ProjetoProgramacaoRepository extends AbstractCrudRepository<
  ProjetoProgramacaoListItem,
  ProjetoProgramacaoFilter
> {
  create(
    data: Prisma.ProjetoProgramacaoCreateInput,
    userId?: string
  ): Promise<ProjetoProgramacaoListItem> {
    return prisma.projetoProgramacao.create({
      data: {
        ...data,
        createdBy: userId || '',
        createdAt: new Date(),
      },
      include: projetoProgramacaoInclude,
    });
  }

  update(
    id: number,
    data: Prisma.ProjetoProgramacaoUpdateInput,
    userId?: string
  ): Promise<ProjetoProgramacaoListItem> {
    return prisma.projetoProgramacao.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || '',
        updatedAt: new Date(),
      },
      include: projetoProgramacaoInclude,
    });
  }

  delete(id: number, userId: string): Promise<ProjetoProgramacaoListItem> {
    return prisma.projetoProgramacao.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: projetoProgramacaoInclude,
    });
  }

  findById(id: number): Promise<ProjetoProgramacaoListItem | null> {
    return prisma.projetoProgramacao.findUnique({
      where: { id, deletedAt: null },
      include: projetoProgramacaoInclude,
    });
  }

  protected getSearchFields(): string[] {
    return [
      'numeroProjeto',
      'municipio',
      'equipamento',
      'descricao',
      'observacao',
    ];
  }

  protected buildCustomFilters(
    params: ProjetoProgramacaoFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.contratoId) {
      where.contratoId = params.contratoId;
    }

    if (params.status) {
      where.status = params.status;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjetoProgramacaoListItem[]> {
    return prisma.projetoProgramacao.findMany({
      where,
      orderBy,
      skip,
      take,
      include:
        (include as Prisma.ProjetoProgramacaoInclude | undefined) ||
        projetoProgramacaoInclude,
    }) as Promise<ProjetoProgramacaoListItem[]>;
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projetoProgramacao.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return projetoProgramacaoInclude;
  }
}
