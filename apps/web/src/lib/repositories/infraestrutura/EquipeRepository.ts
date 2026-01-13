import { Prisma, Equipe } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';
import type {
  GenericPrismaWhereInput,
  GenericPrismaOrderByInput,
  GenericPrismaIncludeInput,
} from '../../types/prisma';

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
  /**
   * Lista equipes com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de relacionamentos (tipoEquipe, contrato, base) de forma otimizada
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

    // Construção do where usando array de condições para evitar conflitos de chaves
    const conditions: Prisma.EquipeWhereInput[] = [];

    // 1. Soft delete
    conditions.push({ deletedAt: null });

    // 2. Filtros diretos
    if (contratoId) conditions.push({ contratoId });
    if (tipoEquipeId) conditions.push({ tipoEquipeId });

    // 3. Busca por texto (OR)
    if (search) {
      const searchFields = this.getSearchFields();
      if (searchFields.length > 0) {
        conditions.push({
          OR: searchFields.map(field => ({
            [field]: { contains: search },
          })),
        });
      }
    }

    // 4. Filtro de Base (Relacionamento)
    // Substitui a filtragem em memória por queries otimizadas no banco
    if (baseId !== undefined) {
      if (baseId === -1) {
        // Sem lotação: Não tem histórico de base ativo
        conditions.push({
          EquipeBaseHistorico: {
            none: {
              dataFim: null,
              deletedAt: null,
            },
          },
        });
      } else {
        // Com lotação específica ativa
        conditions.push({
          EquipeBaseHistorico: {
            some: {
              baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
        });
      }
    }

    // Combina todas as condições em um AND
    const where: Prisma.EquipeWhereInput = {
      AND: conditions,
    };

    const [total, items] = await Promise.all([
      prisma.equipe.count({ where }),
      this.findMany(where, { [orderBy]: orderDir }, skip, pageSize, include),
    ]);

    return { items, total };
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
  ): Promise<Equipe[]> {
    return prisma.equipe.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.equipe.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
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
