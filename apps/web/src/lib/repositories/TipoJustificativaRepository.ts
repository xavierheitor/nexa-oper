/**
 * Repositório para Tipos de Justificativa
 *
 * Implementa operações de acesso a dados para tipos de justificativa
 */

import { TipoJustificativa } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { PaginationParams, GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../types/common';

interface TipoJustificativaFilter extends PaginationParams {
  ativo?: boolean;
}

interface CreateTipoJustificativaData {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  geraFalta?: boolean;
  createdBy: string;
}

export class TipoJustificativaRepository extends AbstractCrudRepository<TipoJustificativa, TipoJustificativaFilter> {
  /**
   * Cria um novo tipo de justificativa
   */
  async create(data: CreateTipoJustificativaData): Promise<TipoJustificativa> {
    return prisma.tipoJustificativa.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        ativo: data.ativo !== undefined ? data.ativo : true,
        geraFalta: data.geraFalta !== undefined ? data.geraFalta : true,
        createdBy: data.createdBy,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Atualiza um tipo de justificativa existente
   */
  async update(id: number, data: Partial<CreateTipoJustificativaData>): Promise<TipoJustificativa> {
    return prisma.tipoJustificativa.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
        ...(data.geraFalta !== undefined && { geraFalta: data.geraFalta }),
      },
    });
  }

  /**
   * Exclui um tipo de justificativa (não usado - tipos não devem ser excluídos, apenas desativados)
   */
  async delete(id: number, userId: string): Promise<TipoJustificativa> {
    return prisma.tipoJustificativa.update({
      where: { id },
      data: {
        ativo: false,
      },
    });
  }

  /**
   * Busca um tipo de justificativa por ID
   */
  async findById(id: number): Promise<TipoJustificativa | null> {
    return prisma.tipoJustificativa.findUnique({
      where: { id },
    });
  }

  /**
   * Busca tipo de justificativa por nome
   */
  async findByNome(nome: string): Promise<TipoJustificativa | null> {
    return prisma.tipoJustificativa.findUnique({
      where: { nome },
    });
  }

  /**
   * Define campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'descricao'];
  }

  /**
   * Executa findMany
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<TipoJustificativa[]> {
    return prisma.tipoJustificativa.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });
  }

  /**
   * Executa count
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.tipoJustificativa.count({ where });
  }

  /**
   * Lista tipos com filtro específico
   */
  async listAll(ativo?: boolean) {
    const where: any = {};
    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    return prisma.tipoJustificativa.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }
}

