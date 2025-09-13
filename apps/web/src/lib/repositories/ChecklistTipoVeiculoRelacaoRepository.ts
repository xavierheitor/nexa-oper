import { Prisma, ChecklistTipoVeiculoRelacao } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface Filter extends PaginationParams {}

export class ChecklistTipoVeiculoRelacaoRepository extends AbstractCrudRepository<
  ChecklistTipoVeiculoRelacao,
  Filter
> {
  create(
    data: Prisma.ChecklistTipoVeiculoRelacaoCreateInput,
    userId?: string
  ): Promise<ChecklistTipoVeiculoRelacao> {
    return prisma.checklistTipoVeiculoRelacao.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.ChecklistTipoVeiculoRelacaoUpdateInput,
    userId?: string
  ): Promise<ChecklistTipoVeiculoRelacao> {
    return prisma.checklistTipoVeiculoRelacao.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<ChecklistTipoVeiculoRelacao> {
    return prisma.checklistTipoVeiculoRelacao.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<ChecklistTipoVeiculoRelacao | null> {
    return prisma.checklistTipoVeiculoRelacao.findUnique({ where: { id, deletedAt: null } as any });
  }

  protected getSearchFields(): string[] {
    return [];
  }

  protected findMany(
    where: Prisma.ChecklistTipoVeiculoRelacaoWhereInput,
    orderBy: Prisma.ChecklistTipoVeiculoRelacaoOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ) {
    return prisma.checklistTipoVeiculoRelacao.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.ChecklistTipoVeiculoRelacaoWhereInput): Promise<number> {
    return prisma.checklistTipoVeiculoRelacao.count({ where });
  }

  async setActiveMapping(
    tipoVeiculoId: number,
    checklistId: number,
    userId: string
  ): Promise<ChecklistTipoVeiculoRelacao> {
    // Soft-delete mapeamentos ativos anteriores para este tipo de veículo
    await prisma.checklistTipoVeiculoRelacao.updateMany({
      where: { tipoVeiculoId, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Cria novo vínculo ativo
    return prisma.checklistTipoVeiculoRelacao.create({
      data: {
        checklist: { connect: { id: checklistId } },
        tipoVeiculo: { connect: { id: tipoVeiculoId } },
        createdAt: new Date(),
        createdBy: userId,
      },
    });
  }
}

