import { AprGrupoPergunta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface AprGrupoPerguntaFilter extends PaginationParams {}

export class AprGrupoPerguntaRepository extends AbstractCrudRepository<
  AprGrupoPergunta,
  AprGrupoPerguntaFilter
> {
  create(
    data: Prisma.AprGrupoPerguntaCreateInput,
    _userId?: string
  ): Promise<AprGrupoPergunta> {
    return prisma.aprGrupoPergunta.create({ data });
  }

  update(
    id: number,
    data: Prisma.AprGrupoPerguntaUpdateInput,
    userId?: string
  ): Promise<AprGrupoPergunta> {
    return prisma.aprGrupoPergunta.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<AprGrupoPergunta> {
    return prisma.aprGrupoPergunta.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<AprGrupoPergunta | null> {
    return prisma.aprGrupoPergunta.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields(): string[] {
    return ['nome', 'tipoResposta'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<AprGrupoPergunta[]> {
    return prisma.aprGrupoPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.aprGrupoPergunta.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      AprGrupoPerguntaRelacao: {
        where: { deletedAt: null },
        select: { id: true, aprPerguntaId: true },
      },
      AprGrupoPerguntaMedidaControleRelacao: {
        where: { deletedAt: null },
        select: {
          id: true,
          aprPerguntaId: true,
          aprMedidaControleId: true,
        },
      },
      AprGrupoOpcaoRespostaRelacao: {
        where: { deletedAt: null },
        select: { id: true, aprOpcaoRespostaId: true },
      },
    };
  }

  async setPerguntas(
    aprGrupoPerguntaId: number,
    perguntaIds: number[],
    userId: string
  ): Promise<void> {
    const existing = await prisma.aprGrupoPerguntaRelacao.findMany({
      where: { aprGrupoPerguntaId, deletedAt: null },
      select: { id: true, aprPerguntaId: true },
    });

    const currentIds = new Set(existing.map((item) => item.aprPerguntaId));
    const targetIds = new Set(perguntaIds);

    const toRemove = existing.filter((item) => !targetIds.has(item.aprPerguntaId));

    await Promise.all(
      toRemove.map((item) =>
        prisma.aprGrupoPerguntaRelacao.update({
          where: { id: item.id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        })
      )
    );

    const toAdd = Array.from(targetIds).filter((id) => !currentIds.has(id));

    await Promise.all(
      toAdd.map((perguntaId, index) =>
        prisma.aprGrupoPerguntaRelacao.create({
          data: {
            aprGrupoPergunta: { connect: { id: aprGrupoPerguntaId } },
            aprPergunta: { connect: { id: perguntaId } },
            ordem: index,
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  async setOpcoes(
    aprGrupoPerguntaId: number,
    opcaoRespostaIds: number[],
    userId: string
  ): Promise<void> {
    const existing = await prisma.aprGrupoOpcaoRespostaRelacao.findMany({
      where: { aprGrupoPerguntaId, deletedAt: null },
      select: { id: true, aprOpcaoRespostaId: true },
    });

    const currentIds = new Set(existing.map((item) => item.aprOpcaoRespostaId));
    const targetIds = new Set(opcaoRespostaIds);

    const toRemove = existing.filter((item) => !targetIds.has(item.aprOpcaoRespostaId));

    await Promise.all(
      toRemove.map((item) =>
        prisma.aprGrupoOpcaoRespostaRelacao.update({
          where: { id: item.id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        })
      )
    );

    const toAdd = Array.from(targetIds).filter((id) => !currentIds.has(id));

    await Promise.all(
      toAdd.map((opcaoId) =>
        prisma.aprGrupoOpcaoRespostaRelacao.create({
          data: {
            aprGrupoPergunta: { connect: { id: aprGrupoPerguntaId } },
            aprOpcaoResposta: { connect: { id: opcaoId } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  async setMedidasControlePorPergunta(
    aprGrupoPerguntaId: number,
    medidasControlePorPergunta: Record<string, number[]>,
    userId: string
  ): Promise<void> {
    const existing = await prisma.aprGrupoPerguntaMedidaControleRelacao.findMany({
      where: { aprGrupoPerguntaId, deletedAt: null },
      select: { id: true, aprPerguntaId: true, aprMedidaControleId: true },
    });

    const currentKeys = new Set(
      existing.map((item) => `${item.aprPerguntaId}:${item.aprMedidaControleId}`)
    );

    const targetEntries = Object.entries(medidasControlePorPergunta).flatMap(
      ([aprPerguntaId, aprMedidaControleIds]) =>
        Array.from(new Set(aprMedidaControleIds)).map((aprMedidaControleId) => ({
          aprPerguntaId: Number(aprPerguntaId),
          aprMedidaControleId,
        }))
    );

    const targetKeys = new Set(
      targetEntries.map(
        (item) => `${item.aprPerguntaId}:${item.aprMedidaControleId}`
      )
    );

    const toRemove = existing.filter(
      (item) => !targetKeys.has(`${item.aprPerguntaId}:${item.aprMedidaControleId}`)
    );

    await Promise.all(
      toRemove.map((item) =>
        prisma.aprGrupoPerguntaMedidaControleRelacao.update({
          where: { id: item.id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        })
      )
    );

    const toAdd = targetEntries.filter(
      (item) => !currentKeys.has(`${item.aprPerguntaId}:${item.aprMedidaControleId}`)
    );

    await Promise.all(
      toAdd.map((item) =>
        prisma.aprGrupoPerguntaMedidaControleRelacao.create({
          data: {
            aprGrupoPergunta: { connect: { id: aprGrupoPerguntaId } },
            aprPergunta: { connect: { id: item.aprPerguntaId } },
            aprMedidaControle: { connect: { id: item.aprMedidaControleId } },
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }
}
