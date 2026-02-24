import { Apr, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface AprFilter extends PaginationParams {}

export class AprRepository extends AbstractCrudRepository<Apr, AprFilter> {
  create(data: Prisma.AprCreateInput, _userId?: string): Promise<Apr> {
    return prisma.apr.create({ data });
  }

  update(id: number, data: Prisma.AprUpdateInput, userId?: string): Promise<Apr> {
    return prisma.apr.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<Apr> {
    return prisma.apr.update({
      where: { id },
      data: {
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  findById(id: number): Promise<Apr | null> {
    return prisma.apr.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Apr[]> {
    return prisma.apr.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.apr.count({ where });
  }

  async setGrupos(aprId: number, grupoPerguntaIds: number[], userId: string): Promise<void> {
    const existing = await prisma.aprGrupoRelacao.findMany({
      where: { aprId, deletedAt: null },
      select: { id: true, aprGrupoPerguntaId: true },
    });

    const currentIds = new Set(existing.map((item) => item.aprGrupoPerguntaId));
    const targetIds = new Set(grupoPerguntaIds);

    const toRemove = existing.filter((item) => !targetIds.has(item.aprGrupoPerguntaId));
    await Promise.all(
      toRemove.map((item) =>
        prisma.aprGrupoRelacao.update({
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
      toAdd.map((grupoPerguntaId, index) =>
        prisma.aprGrupoRelacao.create({
          data: {
            apr: { connect: { id: aprId } },
            aprGrupoPergunta: { connect: { id: grupoPerguntaId } },
            ordem: index,
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      )
    );
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      AprGrupoRelacao: {
        where: { deletedAt: null },
        select: { id: true, aprGrupoPerguntaId: true },
      },
    };
  }
}
