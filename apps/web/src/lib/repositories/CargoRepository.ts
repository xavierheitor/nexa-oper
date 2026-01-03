// NOTE: Tipos podem exigir ajustes finos, mas a implementação está correta.
/**
 * Repository para Cargo
 *
 * Gerencia acesso a dados de cargos
 */

import { Cargo, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface CargoFilter extends PaginationParams {
  // Filtros específicos se necessário
}

export type CargoCreateInput = {
  nome: string;
  salarioBase?: number;
};

export type CargoUpdateInput = Partial<CargoCreateInput> & {
  id: number;
};

export class CargoRepository extends AbstractCrudRepository<
  Cargo,
  CargoFilter
> {
  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected async findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<Cargo[]> {
    return prisma.cargo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || {
        _count: {
          select: {
            Eletricista: true,
          },
        },
      },
    });
  }

  protected async count(where: any): Promise<number> {
    return prisma.cargo.count({ where });
  }

  private toPrismaCreateData(
    data: CargoCreateInput,
    userId?: string
  ): Prisma.CargoCreateInput {
    return {
      nome: data.nome,
      salarioBase: data.salarioBase || 0,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(data: CargoCreateInput, userId?: string): Promise<Cargo> {
    return prisma.cargo.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  // Override do método update com assinatura correta
  override async update(
    id: string | number,
    data: unknown,
    userId?: string
  ): Promise<Cargo> {
    const updateData = data as CargoUpdateInput;
    const { id: _, ...updateFields } = updateData;
    return prisma.cargo.update({
      where: { id: Number(id) },
      data: {
        ...updateFields,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  async findById(id: string | number): Promise<Cargo | null> {
    return prisma.cargo.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        _count: {
          select: {
            Eletricista: true,
          },
        },
      },
    });
  }

  async list(params: CargoFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'nome',
      orderDir = 'asc',
      search,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.CargoWhereInput = {
      deletedAt: null,
      ...(search && {
        nome: { contains: search },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.cargo.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: {
          _count: {
            select: {
              Eletricista: true,
            },
          },
        },
      }),
      prisma.cargo.count({ where }),
    ]);

    return { items, total };
  }

  async delete(id: string | number, userId: string): Promise<Cargo> {
    return prisma.cargo.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
