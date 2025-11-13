/**
 * Repositório para Turnos
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Turno, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 */

import { Prisma, Turno, TurnoEletricista } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';
import { TurnoFilter } from '../schemas/turnoSchema';

/**
 * Tipo para dados de criação de turno
 */
export type TurnoCreateInput = {
  dataSolicitacao: Date;
  dataInicio: Date;
  dataFim?: Date | null;
  veiculoId: number;
  equipeId: number;
  dispositivo: string;
  kmInicio: number;
  kmFim?: number | null;
  eletricistaIds?: number[];
};

/**
 * Tipo para dados de atualização de turno
 */
export type TurnoUpdateInput = Partial<TurnoCreateInput> & {
  id: number;
};

export class TurnoRepository extends AbstractCrudRepository<Turno, TurnoFilter> {
  /**
   * Cria um novo turno
   */
  async create(data: TurnoCreateInput, userId?: string): Promise<Turno> {
    const { eletricistaIds, ...turnoData } = data;

    // Criar turno
    const turno = await prisma.turno.create({
      data: {
        ...turnoData,
        createdAt: new Date(),
        createdBy: userId || '',
      },
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: {
          include: {
            eletricista: true,
          },
        },
      },
    });

    // Se há eletricistas, criar os vínculos
    if (eletricistaIds && eletricistaIds.length > 0) {
      await prisma.turnoEletricista.createMany({
        data: eletricistaIds.map(eletricistaId => ({
          turnoId: turno.id,
          eletricistaId,
          createdAt: new Date(),
          createdBy: userId || '',
        })),
      });
    }

    // Retornar turno completo com relacionamentos
    return prisma.turno.findUnique({
      where: { id: turno.id },
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: {
          include: {
            eletricista: true,
          },
        },
      },
    }) as Promise<Turno>;
  }

  /**
   * Atualiza um turno existente
   */
  async update(
    id: number,
    data: TurnoUpdateInput,
    userId?: string
  ): Promise<Turno> {
    // Remover id e eletricistaIds do objeto de dados (id vai no where, eletricistaIds é tratado separadamente)
    const { id: _, eletricistaIds, kmFim, ...turnoData } = data;

    // Preparar dados para o Prisma (mapear kmFim para KmFim)
    const prismaData: any = {
      ...turnoData,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // Mapear kmFim para KmFim (campo no banco tem K maiúsculo)
    if (kmFim !== undefined) {
      prismaData.KmFim = kmFim;
    }

    // Remover campos undefined para evitar erros do Prisma
    Object.keys(prismaData).forEach(key => {
      if (prismaData[key] === undefined) {
        delete prismaData[key];
      }
    });

    // Atualizar dados do turno
    const turno = await prisma.turno.update({
      where: { id },
      data: prismaData,
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: {
          include: {
            eletricista: true,
          },
        },
      },
    });

    // Se há eletricistas para atualizar
    if (eletricistaIds !== undefined) {
      // Remover todos os vínculos existentes
      await prisma.turnoEletricista.deleteMany({
        where: { turnoId: id },
      });

      // Criar novos vínculos
      if (eletricistaIds.length > 0) {
        await prisma.turnoEletricista.createMany({
          data: eletricistaIds.map(eletricistaId => ({
            turnoId: id,
            eletricistaId,
            createdAt: new Date(),
            createdBy: userId || '',
          })),
        });
      }
    }

    return turno;
  }

  /**
   * Exclui um turno (soft delete)
   */
  async delete(id: number | string, userId: string): Promise<Turno> {
    return prisma.turno.update({
      where: { id: Number(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca um turno por ID
   */
  async findById(id: number | string): Promise<Turno | null> {
    return prisma.turno.findUnique({
      where: {
        id: Number(id),
        deletedAt: null,
      },
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: {
          include: {
            eletricista: true,
          },
        },
      },
    });
  }

  /**
   * Lista turnos com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de status (ABERTO/FECHADO)
   */
  async list(params: TurnoFilter): Promise<{ items: Turno[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id',
      orderDir = 'asc',
      search,
      veiculoId,
      equipeId,
      eletricistaId,
      status,
      dataInicio,
      dataFim,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros server-side
    const where: any = {
      deletedAt: null,
      ...(veiculoId && { veiculoId }),
      ...(equipeId && { equipeId }),
      ...(search && {
        OR: this.getSearchFields().map(field => ({
          [field]: { contains: search },
        })),
      }),
      ...(dataInicio && !dataFim && { dataInicio: { gte: dataInicio } }),
      ...(dataInicio && dataFim && {
        dataInicio: {
          gte: dataInicio,
          lte: dataFim
        }
      }),
    };

    // Filtro de status
    if (status === 'ABERTO') {
      where.dataFim = null;
    } else if (status === 'FECHADO') {
      where.dataFim = { not: null };
    }

    // Filtro de eletricista é especial (relacionamento N:N)
    if (eletricistaId) {
      const turnosComEletricista = await prisma.turnoEletricista.findMany({
        where: {
          eletricistaId,
          deletedAt: null,
        },
        select: { turnoId: true },
      });
      const ids = turnosComEletricista.map(te => te.turnoId);
      if (ids.length === 0) {
        return { items: [], total: 0 };
      }
      where.id = { in: ids };
    }

    const [total, items] = await Promise.all([
      prisma.turno.count({ where }),
      this.findMany(where, { [orderBy]: orderDir }, skip, pageSize, include),
    ]);

    return { items, total };
  }

  /**
   * Define campos que podem ser usados para busca
   */
  protected getSearchFields(): string[] {
    return ['dispositivo'];
  }

    /**
   * Executa a consulta findMany
   */
  protected async findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<Turno[]> {
    const turnos = await prisma.turno.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        veiculo: {
          include: {
            tipoVeiculo: true,
          },
        },
        equipe: {
          include: {
            tipoEquipe: true,
            EquipeBaseHistorico: {
              where: {
                dataFim: null,
                deletedAt: null,
              },
              include: {
                base: true,
              },
              take: 1,
            },
          },
        },
        TurnoEletricistas: {
          include: {
            eletricista: true,
          },
        },
        ...include,
      },
    });

    // Formatar dados para facilitar o uso no frontend
    return turnos.map((turno: any) => ({
      ...turno,
      veiculoPlaca: turno.veiculo?.placa,
      veiculoModelo: turno.veiculo?.modelo,
      equipeNome: turno.equipe?.nome,
      tipoEquipeNome: turno.equipe?.tipoEquipe?.nome,
      baseNome: turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome || 'Sem base',
      eletricistas: turno.TurnoEletricistas?.map((te: any) => ({
        id: te.eletricista.id,
        nome: te.eletricista.nome,
        matricula: te.eletricista.matricula,
      })),
    }));
  }

  /**
   * Executa a consulta count
   */
  protected count(where: Prisma.TurnoWhereInput): Promise<number> {
    return prisma.turno.count({ where });
  }
}
