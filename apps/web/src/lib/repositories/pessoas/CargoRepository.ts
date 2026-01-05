// NOTE: Tipos podem exigir ajustes finos, mas a implementação está correta.
/**
 * Repository para Cargo
 *
 * Gerencia acesso a dados de cargos
 */

import { Cargo, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

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
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Cargo[]> {
    return prisma.cargo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
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
      include: this.getDefaultInclude(),
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
      include: this.getDefaultInclude(),
    });
  }

  async findById(id: string | number): Promise<Cargo | null> {
    return prisma.cargo.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      _count: {
        select: {
          Eletricista: true,
        },
      },
    };
  }

  async delete(id: string | number, userId: string): Promise<Cargo> {
    return prisma.cargo.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
      include: this.getDefaultInclude(),
    });
  }
}
