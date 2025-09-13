import { Prisma, ChecklistTipoEquipeRelacao } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface Filter extends PaginationParams {}

export class ChecklistTipoEquipeRelacaoRepository extends AbstractCrudRepository<
  ChecklistTipoEquipeRelacao,
  Filter
> {
  create(
    data: Prisma.ChecklistTipoEquipeRelacaoCreateInput,
    userId?: string
  ): Promise<ChecklistTipoEquipeRelacao> {
    return prisma.checklistTipoEquipeRelacao.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.ChecklistTipoEquipeRelacaoUpdateInput,
    userId?: string
  ): Promise<ChecklistTipoEquipeRelacao> {
    return prisma.checklistTipoEquipeRelacao.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<ChecklistTipoEquipeRelacao> {
    return prisma.checklistTipoEquipeRelacao.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<ChecklistTipoEquipeRelacao | null> {
    return prisma.checklistTipoEquipeRelacao.findUnique({ where: { id, deletedAt: null } as any });
  }

  protected getSearchFields(): string[] {
    return [];
  }

  protected findMany(
    where: Prisma.ChecklistTipoEquipeRelacaoWhereInput,
    orderBy: Prisma.ChecklistTipoEquipeRelacaoOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ) {
    return prisma.checklistTipoEquipeRelacao.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.ChecklistTipoEquipeRelacaoWhereInput): Promise<number> {
    return prisma.checklistTipoEquipeRelacao.count({ where });
  }

  async setActiveMapping(
    tipoEquipeId: number,
    checklistId: number,
    userId: string
  ): Promise<ChecklistTipoEquipeRelacao> {
    await prisma.checklistTipoEquipeRelacao.updateMany({
      where: { tipoEquipeId, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    return prisma.checklistTipoEquipeRelacao.create({
      data: {
        checklist: { connect: { id: checklistId } },
        tipoEquipe: { connect: { id: tipoEquipeId } },
        createdAt: new Date(),
        createdBy: userId,
      },
    });
  }
}

