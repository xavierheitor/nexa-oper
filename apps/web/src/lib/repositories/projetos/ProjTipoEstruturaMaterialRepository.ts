import {
  Prisma,
  ProjTipoEstruturaMaterial,
} from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

export type ProjTipoEstruturaMaterialRow = Omit<
  ProjTipoEstruturaMaterial,
  'quantidadeBase'
> & {
  quantidadeBase: number;
};

interface ProjTipoEstruturaMaterialFilter extends PaginationParams {
  contratoId?: number;
  tipoEstruturaId?: number;
  materialId?: number;
}

export class ProjTipoEstruturaMaterialRepository extends AbstractCrudRepository<
  ProjTipoEstruturaMaterialRow,
  ProjTipoEstruturaMaterialFilter
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
    data: Prisma.ProjTipoEstruturaMaterialCreateInput,
    userId?: string
  ): Promise<ProjTipoEstruturaMaterialRow> {
    return prisma.projTipoEstruturaMaterial
      .create({
        data: {
          ...data,
          createdBy: userId ?? '',
          createdAt: new Date(),
        },
      })
      .then((item) => this.serialize(item));
  }

  createMany(
    data: Prisma.ProjTipoEstruturaMaterialCreateInput[],
    userId?: string
  ): Promise<ProjTipoEstruturaMaterialRow[]> {
    const now = new Date();

    return prisma
      .$transaction(
        data.map((item) =>
          prisma.projTipoEstruturaMaterial.create({
            data: {
              ...item,
              createdBy: userId ?? '',
              createdAt: now,
            },
          })
        )
      )
      .then((items) => items.map((item) => this.serialize(item)));
  }

  update(
    id: number,
    data: Prisma.ProjTipoEstruturaMaterialUpdateInput,
    userId?: string
  ): Promise<ProjTipoEstruturaMaterialRow> {
    return prisma.projTipoEstruturaMaterial
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

  delete(id: number, userId: string): Promise<ProjTipoEstruturaMaterialRow> {
    return prisma.projTipoEstruturaMaterial
      .update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
        },
      })
      .then((item) => this.serialize(item));
  }

  findById(id: number): Promise<ProjTipoEstruturaMaterialRow | null> {
    return prisma.projTipoEstruturaMaterial
      .findUnique({
        where: { id, deletedAt: null },
      })
      .then((item) => (item ? this.serialize(item) : null));
  }

  protected getSearchFields(): string[] {
    return [];
  }

  protected buildCustomFilters(
    params: ProjTipoEstruturaMaterialFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.contratoId) {
      where.tipoEstrutura = {
        ...(typeof where.tipoEstrutura === 'object' && where.tipoEstrutura ? where.tipoEstrutura : {}),
        contratoId: params.contratoId,
      };
    }

    if (params.tipoEstruturaId) {
      where.tipoEstruturaId = params.tipoEstruturaId;
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
  ): Promise<ProjTipoEstruturaMaterialRow[]> {
    const items = await prisma.projTipoEstruturaMaterial.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? this.getDefaultInclude(),
    });

    return items.map((item) => this.serialize(item)) as ProjTipoEstruturaMaterialRow[];
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projTipoEstruturaMaterial.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      tipoEstrutura: {
        include: {
          contrato: true,
        },
      },
      material: true,
    };
  }
}
