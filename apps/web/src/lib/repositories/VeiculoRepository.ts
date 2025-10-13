import { Prisma, Veiculo } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface VeiculoFilter extends PaginationParams {
  contratoId?: number;
  tipoVeiculoId?: number;
  baseId?: number;
}

// Tipo para dados de criação (sem campos de auditoria)
export type VeiculoCreateInput = {
  placa: string;
  modelo: string;
  ano: number;
  tipoVeiculoId: number;
  contratoId: number;
  baseId?: number;
};

// Tipo para dados de atualização
export type VeiculoUpdateInput = VeiculoCreateInput & {
  id: number;
};

export class VeiculoRepository extends AbstractCrudRepository<Veiculo, VeiculoFilter> {
  /**
   * Converte dados de entrada para o formato Prisma
   *
   * MOTIVO DA CONVERSÃO:
   * - Nossa API recebe IDs simples (tipoVeiculoId: 1)
   * - Prisma precisa de objetos de conexão ({ tipoVeiculo: { connect: { id: 1 } } })
   * - Também adicionamos campos de auditoria automaticamente
   */
  private toPrismaCreateData(
    data: Omit<VeiculoCreateInput, 'baseId'>,
    userId?: string
  ): Prisma.VeiculoCreateInput {
    return {
      placa: data.placa,
      modelo: data.modelo,
      ano: data.ano,
      tipoVeiculo: { connect: { id: data.tipoVeiculoId } },
      contrato: { connect: { id: data.contratoId } },
      createdAt: new Date(),
      createdBy: userId || '',
    };
  }

  async create(data: VeiculoCreateInput, userId?: string): Promise<Veiculo> {
    const { baseId, ...veiculoData } = data;

    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    return prisma.$transaction(async tx => {
      const veiculo = await tx.veiculo.create({
        data: this.toPrismaCreateData(veiculoData, userId),
      });

      if (typeof normalizedBaseId === 'number') {
        await tx.veiculoBaseHistorico.create({
          data: {
            veiculoId: veiculo.id,
            baseId: normalizedBaseId,
            dataInicio: new Date(),
            motivo: 'Lotação inicial',
            createdBy: userId || '',
            createdAt: new Date(),
          },
        });
      }

      return veiculo;
    });
  }

  /**
   * Converte dados de atualização para o formato Prisma
   */
  private toPrismaUpdateData(
    data: Partial<Omit<VeiculoCreateInput, 'baseId'>>,
    userId?: string
  ): Prisma.VeiculoUpdateInput {
    return {
      ...(data.placa && { placa: data.placa }),
      ...(data.modelo && { modelo: data.modelo }),
      ...(data.ano && { ano: data.ano }),
      ...(data.tipoVeiculoId && {
        tipoVeiculo: { connect: { id: data.tipoVeiculoId } },
      }),
      ...(data.contratoId && {
        contrato: { connect: { id: data.contratoId } },
      }),
      updatedAt: new Date(),
      updatedBy: userId || '',
    };
  }

  async update(
    id: number,
    data: Partial<VeiculoCreateInput>,
    userId?: string
  ): Promise<Veiculo> {
    const { baseId, ...veiculoData } = data;

    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    return prisma.$transaction(async tx => {
      const veiculo = await tx.veiculo.update({
        where: { id },
        data: this.toPrismaUpdateData(veiculoData, userId),
      });

      if (typeof normalizedBaseId === 'number') {
        const currentBase = await tx.veiculoBaseHistorico.findFirst({
          where: {
            veiculoId: id,
            dataFim: null,
          },
          orderBy: {
            dataInicio: 'desc',
          },
        });

        if (!currentBase || currentBase.baseId !== normalizedBaseId) {
          if (currentBase) {
            await tx.veiculoBaseHistorico.update({
              where: { id: currentBase.id },
              data: {
                dataFim: new Date(),
                updatedBy: userId || '',
                updatedAt: new Date(),
              },
            });
          }

          await tx.veiculoBaseHistorico.create({
            data: {
              veiculoId: id,
              baseId: normalizedBaseId,
              dataInicio: new Date(),
              motivo: 'Alteração de lotação via edição',
              createdBy: userId || '',
              createdAt: new Date(),
            },
          });
        }
      }

      return veiculo;
    });
  }
  /**
   * Lista veículos com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de relacionamentos (tipoVeiculo, contrato, base)
   */
  async list(
    params: VeiculoFilter
  ): Promise<{ items: Veiculo[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id',
      orderDir = 'asc',
      search,
      contratoId,
      tipoVeiculoId,
      baseId,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros server-side
    const where: any = {
      deletedAt: null,
      ...(contratoId && { contratoId }),
      ...(tipoVeiculoId && { tipoVeiculoId }),
      ...(search && {
        OR: this.getSearchFields().map(field => ({
          [field]: { contains: search, mode: 'insensitive' },
        })),
      }),
    };

    // Filtro de base é especial (relacionamento com histórico)
    if (baseId) {
      // Se baseId = -1, filtra "sem lotação"
      if (baseId === -1) {
        const veiculosComBase = await prisma.veiculoBaseHistorico.findMany({
          where: { dataFim: null, deletedAt: null },
          select: { veiculoId: true },
        });
        const idsComBase = veiculosComBase.map(h => h.veiculoId);
        where.id = { notIn: idsComBase };
      } else {
        // Filtrar por base específica
        const veiculosNaBase = await prisma.veiculoBaseHistorico.findMany({
          where: {
            baseId,
            dataFim: null,
            deletedAt: null,
          },
          select: { veiculoId: true },
        });
        const idsNaBase = veiculosNaBase.map(h => h.veiculoId);
        where.id = { in: idsNaBase };
      }
    }

    const [total, items] = await Promise.all([
      prisma.veiculo.count({ where }),
      this.findMany(where, { [orderBy]: orderDir }, skip, pageSize, include),
    ]);

    return { items, total };
  }

  delete(id: any, userId: string): Promise<Veiculo> {
    return prisma.veiculo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }
  findById(id: any): Promise<Veiculo | null> {
    return prisma.veiculo.findUnique({ where: { id } });
  }
  protected getSearchFields(): string[] {
    return ['placa', 'modelo', 'ano'];
  }
  protected async findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<Veiculo[]> {
    const veiculos = await prisma.veiculo.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });

    // Para cada veículo, buscar sua base atual
    const veiculosWithBase = await Promise.all(
      veiculos.map(async veiculo => {
        try {
          const currentBase = await prisma.veiculoBaseHistorico.findFirst({
            where: {
              veiculoId: veiculo.id,
              dataFim: null, // Base ativa
            },
            include: {
              base: true,
            },
          });

          return {
            ...veiculo,
            baseAtual: currentBase?.base || null,
          };
        } catch (error) {
          console.error(
            `Erro ao buscar base para veículo ${veiculo.id}:`,
            error
          );
          return {
            ...veiculo,
            baseAtual: null,
          };
        }
      })
    );

    return veiculosWithBase;
  }
  protected count(where: Prisma.VeiculoWhereInput): Promise<number> {
    return prisma.veiculo.count({ where });
  }
}
