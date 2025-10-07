/**
 * Repository para PapelEquipe
 *
 * Gerencia acesso a dados da entidade PapelEquipe
 */

import { PapelEquipe, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface PapelEquipeFilter extends PaginationParams {
  ativo?: boolean;
}

export type PapelEquipeCreateInput = {
  nome: string;
  ativo?: boolean;
  exigeHabilitacao?: boolean;
  prioridadeEscala?: number;
};

export type PapelEquipeUpdateInput = Partial<PapelEquipeCreateInput> & {
  id: number;
};

export class PapelEquipeRepository extends AbstractCrudRepository<
  PapelEquipe,
  PapelEquipeFilter
> {
  private toPrismaCreateData(
    data: PapelEquipeCreateInput,
    userId?: string
  ): Prisma.PapelEquipeCreateInput {
    return {
      nome: data.nome,
      ativo: data.ativo ?? true,
      exigeHabilitacao: data.exigeHabilitacao ?? false,
      prioridadeEscala: data.prioridadeEscala,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(
    data: PapelEquipeCreateInput,
    userId?: string
  ): Promise<PapelEquipe> {
    return prisma.papelEquipe.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  async update(
    data: PapelEquipeUpdateInput,
    userId?: string
  ): Promise<PapelEquipe> {
    const { id, ...updateData } = data;
    return prisma.papelEquipe.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  async findById(id: string | number): Promise<PapelEquipe | null> {
    return prisma.papelEquipe.findUnique({
      where: { id: Number(id), deletedAt: null },
    });
  }

  async list(params: PapelEquipeFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'nome',
      orderDir = 'asc',
      search,
      ativo,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.PapelEquipeWhereInput = {
      deletedAt: null,
      ...(ativo !== undefined && { ativo }),
      ...(search && {
        nome: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.papelEquipe.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
      }),
      prisma.papelEquipe.count({ where }),
    ]);

    return { items, total };
  }

  async delete(id: string | number, userId: string): Promise<PapelEquipe> {
    return prisma.papelEquipe.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}

