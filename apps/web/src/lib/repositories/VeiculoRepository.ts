import { Prisma, Veiculo } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { PaginationParams } from '../types/common';

interface VeiculoFilter extends PaginationParams {
  // Campos específicos de filtro podem ser adicionados aqui
}

// Tipo para dados de criação (sem campos de auditoria)
export type VeiculoCreateInput = {
  placa: string;
  modelo: string;
  ano: number;
  tipoVeiculoId: number;
  contratoId: number;
};

// Tipo para dados de atualização
export type VeiculoUpdateInput = VeiculoCreateInput & {
  id: number;
};

export class VeiculoRepository extends AbstractCrudRepository<
  Veiculo,
  VeiculoFilter
> {
  /**
   * Converte dados de entrada para o formato Prisma
   *
   * MOTIVO DA CONVERSÃO:
   * - Nossa API recebe IDs simples (tipoVeiculoId: 1)
   * - Prisma precisa de objetos de conexão ({ tipoVeiculo: { connect: { id: 1 } } })
   * - Também adicionamos campos de auditoria automaticamente
   */
  private toPrismaCreateData(
    data: VeiculoCreateInput,
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

  create(data: VeiculoCreateInput, userId?: string): Promise<Veiculo> {
    // Agora é mais simples - apenas converte e cria
    return prisma.veiculo.create({
      data: this.toPrismaCreateData(data, userId),
    });
  }

  /**
   * Converte dados de atualização para o formato Prisma
   */
  private toPrismaUpdateData(
    data: Partial<VeiculoCreateInput>,
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

  update(
    id: number,
    data: Partial<VeiculoCreateInput>,
    userId?: string
  ): Promise<Veiculo> {
    // Agora é mais simples - apenas converte e atualiza
    return prisma.veiculo.update({
      where: { id },
      data: this.toPrismaUpdateData(data, userId),
    });
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
  protected findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
  ): Promise<Veiculo[]> {
    return prisma.veiculo.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }
  protected count(where: Prisma.VeiculoWhereInput): Promise<number> {
    return prisma.veiculo.count({ where });
  }
}
