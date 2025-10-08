/**
 * Serviço para TipoEscala
 *
 * Gerencia lógica de negócio para tipos de escala
 * (4x2, 5x1, Espanhola, etc)
 */

import { TipoEscala } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  TipoEscalaCreateInput,
  TipoEscalaRepository,
  TipoEscalaUpdateInput,
} from '../../repositories/escala/TipoEscalaRepository';
import {
  tipoEscalaCreateSchema,
  tipoEscalaFilterSchema,
  tipoEscalaUpdateSchema,
  salvarPosicoesCicloSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';
import { prisma } from '../../db/db.service';

type TipoEscalaCreate = z.infer<typeof tipoEscalaCreateSchema>;
type TipoEscalaUpdate = z.infer<typeof tipoEscalaUpdateSchema>;
type TipoEscalaFilter = z.infer<typeof tipoEscalaFilterSchema>;
type SalvarPosicoesCiclo = z.infer<typeof salvarPosicoesCicloSchema>;

export class TipoEscalaService extends AbstractCrudService<
  TipoEscalaCreate,
  TipoEscalaUpdate,
  TipoEscalaFilter,
  TipoEscala
> {
  private tipoRepo: TipoEscalaRepository;

  constructor() {
    const repo = new TipoEscalaRepository();
    super(repo);
    this.tipoRepo = repo;
  }

  async create(data: TipoEscalaCreate, userId: string): Promise<TipoEscala> {
    const createData: TipoEscalaCreateInput = {
      nome: data.nome,
      modoRepeticao: data.modoRepeticao,
      cicloDias: data.cicloDias,
      periodicidadeSemanas: data.periodicidadeSemanas,
      eletricistasPorTurma: data.eletricistasPorTurma,
      ativo: data.ativo,
      observacoes: data.observacoes,
    };

    return this.tipoRepo.create(createData, userId);
  }

  async update(data: TipoEscalaUpdate, userId: string): Promise<TipoEscala> {
    const { id, ...updateData } = data;
    const updateInput: TipoEscalaUpdateInput = {
      id,
      ...updateData,
    };

    return this.tipoRepo.update(updateInput, userId);
  }

  async list(params: TipoEscalaFilter): Promise<PaginatedResult<TipoEscala>> {
    const { items, total } = await this.tipoRepo.list(params);
    return {
      data: items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Salva/Atualiza as posições do ciclo de dias de um tipo de escala
   */
  async salvarPosicoesCiclo(
    data: SalvarPosicoesCiclo,
    userId: string
  ): Promise<{ success: boolean; posicoesAtualizadas: number }> {
    const { tipoEscalaId, posicoes } = data;

    // Verifica se o tipo de escala existe
    const tipoEscala = await this.tipoRepo.findById(tipoEscalaId);
    if (!tipoEscala) {
      throw new Error('Tipo de escala não encontrado');
    }

    if (tipoEscala.modoRepeticao !== 'CICLO_DIAS') {
      throw new Error('Este tipo de escala não usa ciclo de dias');
    }

    // Deleta todas as posições existentes e cria novas em uma transação
    await prisma.$transaction(async tx => {
      // Remove todas as posições existentes
      await tx.tipoEscalaCicloPosicao.deleteMany({
        where: { tipoEscalaId },
      });

      // Cria as novas posições
      await tx.tipoEscalaCicloPosicao.createMany({
        data: posicoes.map(pos => ({
          tipoEscalaId,
          posicao: pos.posicao,
          status: pos.status,
          createdBy: userId,
        })),
      });
    });

    return {
      success: true,
      posicoesAtualizadas: posicoes.length,
    };
  }

  async salvarMascarasSemanas(
    data: SalvarMascarasSemanas,
    userId: string
  ): Promise<{ success: boolean; mascarasAtualizadas: number }> {
    const { tipoEscalaId, mascaras } = data;

    // Verifica se o tipo de escala existe
    const tipoEscala = await this.tipoRepo.findById(tipoEscalaId);
    if (!tipoEscala) {
      throw new Error('Tipo de escala não encontrado');
    }

    if (tipoEscala.modoRepeticao !== 'SEMANA_DEPENDENTE') {
      throw new Error('Este tipo de escala não usa máscaras de semana');
    }

    // Deleta todas as máscaras existentes e cria novas em uma transação
    await prisma.$transaction(async tx => {
      // Remove todas as máscaras existentes
      await tx.tipoEscalaSemanaMascara.deleteMany({
        where: { tipoEscalaId },
      });

      // Cria as novas máscaras
      await tx.tipoEscalaSemanaMascara.createMany({
        data: mascaras.map(mascara => ({
          tipoEscalaId,
          semanaIndex: mascara.semanaIndex,
          dia: mascara.dia,
          status: mascara.status,
          createdBy: userId,
        })),
      });
    });

    return {
      success: true,
      mascarasAtualizadas: mascaras.length,
    };
  }
}

