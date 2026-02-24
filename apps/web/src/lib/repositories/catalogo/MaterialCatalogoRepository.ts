import { MaterialCatalogo, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface MaterialCatalogoFilter extends PaginationParams {
  contratoId?: number;
}

export class MaterialCatalogoRepository extends AbstractCrudRepository<
  MaterialCatalogo,
  MaterialCatalogoFilter
> {
  create(
    data: Prisma.MaterialCatalogoCreateInput,
    userId?: string
  ): Promise<MaterialCatalogo> {
    return prisma.materialCatalogo.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.MaterialCatalogoUpdateInput,
    userId?: string
  ): Promise<MaterialCatalogo> {
    return prisma.materialCatalogo.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<MaterialCatalogo> {
    return prisma.materialCatalogo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<MaterialCatalogo | null> {
    return prisma.materialCatalogo.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields(): string[] {
    return ['codigo', 'descricao', 'unidadeMedida'];
  }

  protected buildCustomFilters(
    params: MaterialCatalogoFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.contratoId) {
      where.contratoId = params.contratoId;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<MaterialCatalogo[]> {
    return prisma.materialCatalogo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.materialCatalogo.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return { contrato: true };
  }
}
