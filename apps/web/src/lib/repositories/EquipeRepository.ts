import { Prisma, Equipe } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface EquipeFilter extends PaginationParams {
  contratoId?: number;
  tipoEquipeId?: number;
  baseId?: number;
}

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

  /**
   * Lista equipes com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de relacionamentos (tipoEquipe, contrato, base)
   */
  async list(
    params: EquipeFilter
  ): Promise<{ items: Equipe[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id',
      orderDir = 'asc',
      search,
      contratoId,
      tipoEquipeId,
      baseId,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros server-side
    const where: any = {
      deletedAt: null,
      ...(contratoId && { contratoId }),
      ...(tipoEquipeId && { tipoEquipeId }),
      ...(search && {
        OR: this.getSearchFields().map(field => ({
          [field]: { contains: search },
        })),
      }),
    };

    // Filtro de base é especial (relacionamento com histórico)
    if (baseId !== undefined) {
      // Se baseId = -1, filtra "sem lotação"
      if (baseId === -1) {
        const equipesComBase = await prisma.equipeBaseHistorico.findMany({
          where: { dataFim: null, deletedAt: null },
          select: { equipeId: true },
        });
        const idsComBase = equipesComBase.map(h => h.equipeId);
        where.id = idsComBase.length > 0 ? { notIn: idsComBase } : undefined;
      } else {
        // Filtrar por base específica
        const equipesNaBase = await prisma.equipeBaseHistorico.findMany({
          where: {
            baseId,
            dataFim: null,
            deletedAt: null,
          },
          select: { equipeId: true },
        });
        const idsNaBase = equipesNaBase.map(h => h.equipeId);
        // Se não encontrou nenhuma, retorna vazio
        if (idsNaBase.length === 0) {
          return { items: [], total: 0 };
        }
        where.id = { in: idsNaBase };
      }
    }

    const [total, items] = await Promise.all([
      prisma.equipe.count({ where }),
      this.findMany(where, { [orderBy]: orderDir }, skip, pageSize, include),
    ]);

    return { items, total };
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

  /**
   * Busca a base atual de uma equipe
   *
   * @param equipeId - ID da equipe
   * @returns Base atual ou null se não houver
   */
  async findBaseAtual(equipeId: number) {
    const historico = await prisma.equipeBaseHistorico.findFirst({
      where: {
        equipeId,
        dataFim: null,
        deletedAt: null,
      },
      include: {
        base: true,
      },
      orderBy: {
        dataInicio: 'desc',
      },
    });

    return historico?.base || null;
  }

  /**
   * Busca histórico completo de bases de uma equipe
   *
   * @param equipeId - ID da equipe
   * @returns Array com histórico de bases
   */
  async findHistoricoBase(equipeId: number) {
    return prisma.equipeBaseHistorico.findMany({
      where: {
        equipeId,
        deletedAt: null,
      },
      include: {
        base: true,
      },
      orderBy: {
        dataInicio: 'desc',
      },
    });
  }
}


