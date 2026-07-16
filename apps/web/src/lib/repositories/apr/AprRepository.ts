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

  update(
    id: number,
    data: Prisma.AprUpdateInput,
    userId?: string
  ): Promise<Apr> {
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

  async setGrupos(
    aprId: number,
    grupoPerguntaIds: number[],
    userId: string
  ): Promise<void> {
    const orderedTargetIds = Array.from(new Set(grupoPerguntaIds));
    const existing = await prisma.aprGrupoRelacao.findMany({
      where: { aprId, deletedAt: null },
      select: { id: true, aprGrupoPerguntaId: true, ordem: true },
    });

    const targetIds = new Set(orderedTargetIds);

    const toRemove = existing.filter(
      item => !targetIds.has(item.aprGrupoPerguntaId)
    );
    await Promise.all(
      toRemove.map(item =>
        prisma.aprGrupoRelacao.update({
          where: { id: item.id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        })
      )
    );

    await Promise.all(
      orderedTargetIds.map((grupoPerguntaId, index) => {
        const existingRel = existing.find(
          item => item.aprGrupoPerguntaId === grupoPerguntaId
        );

        if (existingRel) {
          return prisma.aprGrupoRelacao.update({
            where: { id: existingRel.id },
            data: {
              ordem: index,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });
        }

        return prisma.aprGrupoRelacao.create({
          data: {
            apr: { connect: { id: aprId } },
            aprGrupoPergunta: { connect: { id: grupoPerguntaId } },
            ordem: index,
            createdAt: new Date(),
            createdBy: userId,
          },
        });
      })
    );
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      AprGrupoRelacao: {
        where: { deletedAt: null },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        select: { id: true, aprGrupoPerguntaId: true, ordem: true },
      },
    };
  }
}
