import {
  Prisma,
  ProjTipoRamalMaterial,
} from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

export type ProjTipoRamalMaterialRow = Omit<
  ProjTipoRamalMaterial,
  'quantidadeBase'
> & {
  quantidadeBase: number;
};

interface ProjTipoRamalMaterialFilter extends PaginationParams {
  contratoId?: number;
  tipoRamalId?: number;
  materialId?: number;
}

export class ProjTipoRamalMaterialRepository extends AbstractCrudRepository<
  ProjTipoRamalMaterialRow,
  ProjTipoRamalMaterialFilter
> {
  private serialize<T extends { quantidadeBase: Prisma.Decimal | number | string }>(
    item: T
  ): Omit<T, 'quantidadeBase'> & { quantidadeBase: number } {
    return {
      ...item,
      quantidadeBase: Number(item.quantidadeBase),
    };
  }

  create(
    data: Prisma.ProjTipoRamalMaterialCreateInput,
    userId?: string
  ): Promise<ProjTipoRamalMaterialRow> {
    return prisma.projTipoRamalMaterial
      .create({
        data: {
          ...data,
          createdBy: userId ?? '',
          createdAt: new Date(),
        },
      })
      .then((item) => this.serialize(item));
  }

  update(
    id: number,
    data: Prisma.ProjTipoRamalMaterialUpdateInput,
    userId?: string
  ): Promise<ProjTipoRamalMaterialRow> {
    return prisma.projTipoRamalMaterial
      .update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId ?? '',
          updatedAt: new Date(),
        },
      })
      .then((item) => this.serialize(item));
  }

  delete(id: number, userId: string): Promise<ProjTipoRamalMaterialRow> {
    return prisma.projTipoRamalMaterial
      .update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      })
      .then((item) => this.serialize(item));
  }

  findById(id: number): Promise<ProjTipoRamalMaterialRow | null> {
    return prisma.projTipoRamalMaterial
      .findUnique({
        where: { id, deletedAt: null },
      })
      .then((item) => (item ? this.serialize(item) : null));
  }

  protected getSearchFields(): string[] {
    return [];
  }

  protected buildCustomFilters(
    params: ProjTipoRamalMaterialFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.contratoId) {
      where.contratoId = params.contratoId;
    }

    if (params.tipoRamalId) {
      where.tipoRamalId = params.tipoRamalId;
    }

    if (params.materialId) {
      where.materialId = params.materialId;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjTipoRamalMaterialRow[]> {
    const items = await prisma.projTipoRamalMaterial.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? this.getDefaultInclude(),
    });

    return items.map((item) => this.serialize(item)) as ProjTipoRamalMaterialRow[];
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projTipoRamalMaterial.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      contrato: true,
      tipoRamal: true,
      material: true,
    };
  }
}
