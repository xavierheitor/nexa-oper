/**
 * Serviço para Justificativas de Equipe
 *
 * Implementa lógica de negócio para justificativas quando equipes não abrem turno
 */

import { JustificativaEquipe } from '@nexa-oper/db';
import { prisma } from '../../db/db.service';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { JustificativaEquipeRepository } from '../../repositories/justificativas/JustificativaEquipeRepository';
import type {
  CriarJustificativaEquipeInput,
} from '../../schemas/justificativaEquipeSchema';
import { PaginatedResult } from '../../types/common';
import type { PaginationParams } from '../../types/common';

// Tipo de filtro compatível com PaginationParams
type JustificativaEquipeFilter = PaginationParams & {
  equipeId?: number;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
  dataInicio?: Date;
  dataFim?: Date;
};

export class JustificativaEquipeService extends AbstractCrudService<
  CriarJustificativaEquipeInput,
  { id: number }, // Stub para update (nunca usado)
  JustificativaEquipeFilter,
  JustificativaEquipe
> {
  private justificativaEquipeRepo: JustificativaEquipeRepository;

  constructor() {
    const repo = new JustificativaEquipeRepository();
    // Cast necessário porque JustificativaEquipeRepository tem assinatura customizada
    super(repo as any);
    this.justificativaEquipeRepo = repo;
  }

  /**
   * Cria uma nova justificativa de equipe
   * Valida se já existe justificativa para a equipe naquela data
   */
  async create(
    data: CriarJustificativaEquipeInput,
    userId: string
  ): Promise<JustificativaEquipe> {
    const dataReferencia = new Date(data.dataReferencia);

    // Verificar se já existe justificativa para esta equipe e data
    const existente = await this.justificativaEquipeRepo.findByEquipeAndData(
      data.equipeId,
      dataReferencia
    );
    if (existente) {
      throw new Error(
        'Já existe uma justificativa para esta equipe nesta data'
      );
    }

    return this.justificativaEquipeRepo.create({
      equipeId: data.equipeId,
      dataReferencia,
      tipoJustificativaId: data.tipoJustificativaId,
      descricao: data.descricao,
      createdBy: userId,
    });
  }

  async update(
    _data: { id: number },
    _userId: string
  ): Promise<JustificativaEquipe> {
    throw new Error(
      'Justificativas de equipe não podem ser atualizadas diretamente pelo service. Use aprovar/rejeitar.'
    );
  }

  /**
   * Lista justificativas de equipe com filtros
   */
  override async list(
    params: JustificativaEquipeFilter
  ): Promise<PaginatedResult<JustificativaEquipe>> {
    return super.list(params);
  }

  /**
   * Aprova uma justificativa de equipe
   * Se o tipo não gera falta, remove faltas pendentes dos eletricistas da equipe
   */
  async aprovar(id: number, userId: string): Promise<JustificativaEquipe> {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser aprovadas');
    }

    // Atualizar status da justificativa
    const resultado = (await this.justificativaEquipeRepo.updateStatus(
      id,
      'aprovada',
      userId
    )) as any;

    // Se não gera falta, remover faltas pendentes dos eletricistas escalados nesta equipe e data
    if (!resultado.tipoJustificativa?.geraFalta) {
      await this.removerFaltasPendentes(
        resultado.equipeId,
        resultado.dataReferencia
      );
    }

    return resultado;
  }

  /**
   * Rejeita uma justificativa de equipe
   */
  async rejeitar(id: number, userId: string): Promise<JustificativaEquipe> {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser rejeitadas');
    }

    return this.justificativaEquipeRepo.updateStatus(id, 'rejeitada', userId);
  }

  /**
   * Remove faltas pendentes dos eletricistas escalados na equipe na data
   */
  private async removerFaltasPendentes(equipeId: number, dataReferencia: Date) {
    const dataRefInicio = new Date(dataReferencia);
    dataRefInicio.setHours(0, 0, 0, 0);
    const dataRefFim = new Date(dataReferencia);
    dataRefFim.setHours(23, 59, 59, 999);

    // Buscar slots da escala para esta equipe nesta data
    const slots = await prisma.slotEscala.findMany({
      where: {
        data: {
          gte: dataRefInicio,
          lte: dataRefFim,
        },
        escalaEquipePeriodo: {
          equipeId,
        },
        estado: 'TRABALHO',
      },
      select: {
        eletricistaId: true,
      },
    });

    const eletricistaIds = slots.map(s => s.eletricistaId);

    if (eletricistaIds.length > 0) {
      // Remover faltas pendentes dos eletricistas desta equipe nesta data
      await prisma.falta.deleteMany({
        where: {
          dataReferencia: {
            gte: dataRefInicio,
            lte: dataRefFim,
          },
          equipeId,
          eletricistaId: { in: eletricistaIds },
          status: 'pendente',
        },
      });
    }
  }

  // getById vem da classe abstrata
}
