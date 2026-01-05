import { Prisma, TipoAtividade } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface TipoAtividadeFilter extends PaginationParams {}

export class TipoAtividadeRepository extends AbstractCrudRepository<
  TipoAtividade,
  TipoAtividadeFilter
> {
  create(data: Prisma.TipoAtividadeCreateInput, userId?: string): Promise<TipoAtividade> {
    return prisma.tipoAtividade.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(id: number, data: Prisma.TipoAtividadeUpdateInput, userId?: string): Promise<TipoAtividade> {
    return prisma.tipoAtividade.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<TipoAtividade> {
    return prisma.tipoAtividade.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<TipoAtividade | null> {
    return prisma.tipoAtividade.findUnique({ where: { id, deletedAt: null } });
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
  ): Promise<TipoAtividade[]> {
    return prisma.tipoAtividade.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoAtividade.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}

