import { Prisma, TipoAtividadeServico } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface TipoAtividadeServicoFilter extends PaginationParams {
  atividadeTipoId?: number;
}

export class TipoAtividadeServicoRepository extends AbstractCrudRepository<
  TipoAtividadeServico,
  TipoAtividadeServicoFilter
> {
  create(
    data: Prisma.TipoAtividadeServicoCreateInput,
    userId?: string
  ): Promise<TipoAtividadeServico> {
    return prisma.tipoAtividadeServico.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.TipoAtividadeServicoUpdateInput,
    userId?: string
  ): Promise<TipoAtividadeServico> {
    return prisma.tipoAtividadeServico.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<TipoAtividadeServico> {
    return prisma.tipoAtividadeServico.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<TipoAtividadeServico | null> {
    return prisma.tipoAtividadeServico.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected buildCustomFilters(
    params: TipoAtividadeServicoFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.atividadeTipoId) {
      where.atividadeTipoId = params.atividadeTipoId;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<TipoAtividadeServico[]> {
    return prisma.tipoAtividadeServico.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoAtividadeServico.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return { atividadeTipo: true };
  }
}
