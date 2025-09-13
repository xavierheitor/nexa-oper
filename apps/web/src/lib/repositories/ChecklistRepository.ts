import { Prisma, Checklist } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface ChecklistFilter extends PaginationParams {}

export class ChecklistRepository extends AbstractCrudRepository<
  Checklist,
  ChecklistFilter
> {
  async create(
    data: { nome: string; tipoChecklistId: number },
    userId?: string
  ): Promise<Checklist> {
    return prisma.checklist.create({
      data: {
        nome: data.nome,
        tipoChecklist: { connect: { id: data.tipoChecklistId } },
        createdAt: new Date(),
        createdBy: userId || '',
      },
    });
  }

  async update(
    id: number,
    data: Partial<{ nome: string; tipoChecklistId: number }>,
    userId?: string
  ): Promise<Checklist> {
    return prisma.checklist.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.tipoChecklistId && {
          tipoChecklist: { connect: { id: data.tipoChecklistId } },
        }),
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  delete(id: number, userId: string): Promise<Checklist> {
    return prisma.checklist.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<Checklist | null> {
    return prisma.checklist.findUnique({
      where: { id, deletedAt: null },
      include: {
        tipoChecklist: true,
        ChecklistPerguntaRelacao: {
          where: { deletedAt: null },
          select: { id: true, checklistPerguntaId: true },
        },
        ChecklistOpcaoRespostaRelacao: {
          where: { deletedAt: null },
          select: { id: true, checklistOpcaoRespostaId: true },
        },
      },
    });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected findMany(
    where: Prisma.ChecklistWhereInput,
    orderBy: Prisma.ChecklistOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<Checklist[]> {
    return prisma.checklist.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  protected count(where: Prisma.ChecklistWhereInput): Promise<number> {
    return prisma.checklist.count({ where });
  }

  // Relações com Perguntas
  async setPerguntas(checklistId: number, perguntaIds: number[], userId: string) {
    const existing = await prisma.checklistPerguntaRelacao.findMany({
      where: { checklistId, deletedAt: null },
      select: { id: true, checklistPerguntaId: true },
    });
    const currentIds = new Set(existing.map((e) => e.checklistPerguntaId));
    const targetIds = new Set(perguntaIds);

    // Soft delete removidas
    const toRemove = existing.filter((e) => !targetIds.has(e.checklistPerguntaId));
    await Promise.all(
      toRemove.map((rel) =>
        prisma.checklistPerguntaRelacao.update({
          where: { id: rel.id },
          data: { deletedAt: new Date(), deletedBy: userId },
        })
      )
    );

    // Adicionar novas
    const toAdd = [...targetIds].filter((id) => !currentIds.has(id));
    await Promise.all(
      toAdd.map((pid) =>
        prisma.checklistPerguntaRelacao.create({
          data: {
            checklist: { connect: { id: checklistId } },
            checklistPergunta: { connect: { id: pid } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  // Relações com Opções de Resposta
  async setOpcoes(checklistId: number, opcaoIds: number[], userId: string) {
    const existing = await prisma.checklistOpcaoRespostaRelacao.findMany({
      where: { checklistId, deletedAt: null },
      select: { id: true, checklistOpcaoRespostaId: true },
    });
    const currentIds = new Set(existing.map((e) => e.checklistOpcaoRespostaId));
    const targetIds = new Set(opcaoIds);

    const toRemove = existing.filter((e) => !targetIds.has(e.checklistOpcaoRespostaId));
    await Promise.all(
      toRemove.map((rel) =>
        prisma.checklistOpcaoRespostaRelacao.update({
          where: { id: rel.id },
          data: { deletedAt: new Date(), deletedBy: userId },
        })
      )
    );

    const toAdd = [...targetIds].filter((id) => !currentIds.has(id));
    await Promise.all(
      toAdd.map((oid) =>
        prisma.checklistOpcaoRespostaRelacao.create({
          data: {
            checklist: { connect: { id: checklistId } },
            checklistOpcaoResposta: { connect: { id: oid } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }
}
