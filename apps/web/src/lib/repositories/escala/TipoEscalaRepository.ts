/**
 * Repository para TipoEscala
 *
 * Gerencia acesso a dados de tipos de escala (4x2, 5x1, Espanhola, etc)
 */

import { TipoEscala, Prisma, ModoRepeticao } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { PaginationParams } from '../../types/common';

interface TipoEscalaFilter extends PaginationParams {
  ativo?: boolean;
  modoRepeticao?: ModoRepeticao;
}

export type TipoEscalaCreateInput = {
  nome: string;
  modoRepeticao: ModoRepeticao;
  cicloDias?: number;
  periodicidadeSemanas?: number;
  eletricistasPorTurma?: number;
  ativo?: boolean;
  observacoes?: string;
};

export type TipoEscalaUpdateInput = Partial<TipoEscalaCreateInput> & {
  id: number;
};

export class TipoEscalaRepository extends AbstractCrudRepository<
  TipoEscala,
  TipoEscalaFilter
> {
  private toPrismaCreateData(
    data: TipoEscalaCreateInput,
    userId?: string
  ): Prisma.TipoEscalaCreateInput {
    return {
      nome: data.nome,
      modoRepeticao: data.modoRepeticao,
      cicloDias: data.cicloDias,
      periodicidadeSemanas: data.periodicidadeSemanas,
      eletricistasPorTurma: data.eletricistasPorTurma,
      ativo: data.ativo ?? true,
      observacoes: data.observacoes,
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(
    data: TipoEscalaCreateInput,
    userId?: string
  ): Promise<TipoEscala> {
    return prisma.tipoEscala.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  async update(
    data: TipoEscalaUpdateInput,
    userId?: string
  ): Promise<TipoEscala> {
    const { id, ...updateData } = data;
    return prisma.tipoEscala.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  async findById(id: string | number): Promise<TipoEscala | null> {
    return prisma.tipoEscala.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        CicloPosicoes: {
          orderBy: { posicao: 'asc' },
        },
        SemanaMascaras: {
          orderBy: [{ semanaIndex: 'asc' }, { dia: 'asc' }],
        },
      },
    });
  }

  async list(params: TipoEscalaFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'nome',
      orderDir = 'asc',
      search,
      ativo,
      modoRepeticao,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.TipoEscalaWhereInput = {
      deletedAt: null,
      ...(ativo !== undefined && { ativo }),
      ...(modoRepeticao && { modoRepeticao }),
      ...(search && {
        OR: [
          { nome: { contains: search } },
          { observacoes: { contains: search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.tipoEscala.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: {
          _count: {
            select: {
              CicloPosicoes: true,
              SemanaMascaras: true,
            },
          },
        },
      }),
      prisma.tipoEscala.count({ where }),
    ]);

    return { items, total };
  }

  async delete(id: string | number, userId: string): Promise<TipoEscala> {
    return prisma.tipoEscala.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}

