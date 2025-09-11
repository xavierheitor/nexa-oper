import { Prisma, Equipe } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface EquipeFilter extends PaginationParams {}

export type EquipeCreateInput = {
  nome: string;
  tipoEquipeId: number;
  contratoId: number;
};

export class EquipeRepository extends AbstractCrudRepository<
  Equipe,
  EquipeFilter
> {
  private toPrismaCreateData(
    data: EquipeCreateInput,
    userId?: string
  ): Prisma.EquipeCreateInput {
    return {
      nome: data.nome,
      tipoEquipe: { connect: { id: data.tipoEquipeId } },
      contrato: { connect: { id: data.contratoId } },
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  create(data: EquipeCreateInput, userId?: string): Promise<Equipe> {
    return prisma.equipe.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  private toPrismaUpdateData(
    data: Partial<EquipeCreateInput>,
    userId?: string
  ): Prisma.EquipeUpdateInput {
    return {
      ...(data.nome && { nome: data.nome }),
      ...(data.tipoEquipeId && {
        tipoEquipe: { connect: { id: data.tipoEquipeId } },
      }),
      ...(data.contratoId && {
        contrato: { connect: { id: data.contratoId } },
      }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };
  }

  update(
    id: number,
    data: Partial<EquipeCreateInput>,
    userId?: string
  ): Promise<Equipe> {
    return prisma.equipe.update({
      where: { id },
      data: this.toPrismaUpdateData(data, userId),
    });
  }

  delete(id: number, userId: string): Promise<Equipe> {
    return prisma.equipe.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<Equipe | null> {
    return prisma.equipe.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: Prisma.EquipeWhereInput,
    orderBy: Prisma.EquipeOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<Equipe[]> {
    return prisma.equipe.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.EquipeWhereInput): Promise<number> {
    return prisma.equipe.count({ where });
  }
}

