import { Prisma, ChecklistTipoEquipeRelacao } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

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
    return prisma.checklistTipoEquipeRelacao.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields(): string[] {
    return [];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ChecklistTipoEquipeRelacao[]> {
    return prisma.checklistTipoEquipeRelacao.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.checklistTipoEquipeRelacao.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }

  async setActiveMapping(
    tipoEquipeId: number,
    checklistId: number,
    userId: string
  ): Promise<ChecklistTipoEquipeRelacao> {
    // Buscar o tipo do checklist que está sendo vinculado
    // Validação de existência já foi feita no Service
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      select: { tipoChecklistId: true },
    });

    // Proteção técnica contra dados inconsistentes
    if (!checklist) {
      throw new Error(
        'Inconsistência de dados: checklist não encontrado no banco'
      );
    }

    // Soft delete de checklists do mesmo tipo já vinculados a esta equipe
    await prisma.checklistTipoEquipeRelacao.updateMany({
      where: {
        tipoEquipeId,
        tipoChecklistId: checklist.tipoChecklistId,
        deletedAt: null,
      },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Criar nova relação
    return prisma.checklistTipoEquipeRelacao.create({
      data: {
        checklist: { connect: { id: checklistId } },
        tipoEquipe: { connect: { id: tipoEquipeId } },
        tipoChecklist: { connect: { id: checklist.tipoChecklistId } },
        createdAt: new Date(),
        createdBy: userId,
      },
    });
  }
}

