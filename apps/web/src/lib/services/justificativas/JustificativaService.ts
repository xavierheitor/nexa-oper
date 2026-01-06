/**
 * Serviço para Justificativas Individuais (Eletricista)
 *
 * Implementa lógica de negócio para justificativas de faltas individuais
 */

import { Justificativa } from '@nexa-oper/db';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { JustificativaRepository } from '../../repositories/justificativas/JustificativaRepository';
import type {
  CriarJustificativaInput,
} from '../../schemas/justificativaSchema';
import { PaginatedResult } from '../../types/common';
import type { PaginationParams } from '../../types/common';

// Tipo de filtro compatível com PaginationParams
type JustificativaFilter = PaginationParams & {
  eletricistaId?: number;
  equipeId?: number;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
  dataInicio?: Date;
  dataFim?: Date;
};

export class JustificativaService extends AbstractCrudService<
  CriarJustificativaInput,
  { id: number }, // Stub para update (nunca usado)
  JustificativaFilter,
  Justificativa
> {
  private justificativaRepo: JustificativaRepository;

  constructor() {
    const repo = new JustificativaRepository();
    // Cast necessário porque JustificativaRepository tem assinatura customizada
    super(repo as any);
    this.justificativaRepo = repo;
  }

  /**
   * Cria uma nova justificativa individual e vincula à falta
   */
  async create(
    data: CriarJustificativaInput,
    userId: string
  ): Promise<Justificativa> {
    return this.justificativaRepo.create({
      faltaId: data.faltaId,
      tipoJustificativaId: data.tipoJustificativaId,
      descricao: data.descricao,
      createdBy: userId,
    });
  }

  async update(_data: { id: number }, _userId: string): Promise<Justificativa> {
    throw new Error(
      'Justificativas individuais não podem ser atualizadas diretamente pelo service. Use aprovar/rejeitar.'
    );
  }

  /**
   * Lista justificativas individuais com filtros
   */
  override async list(
    params: JustificativaFilter
  ): Promise<PaginatedResult<Justificativa>> {
    return super.list(params);
  }

  /**
   * Aprova uma justificativa individual
   * Atualiza status da falta para 'justificada'
   */
  async aprovar(id: number, userId: string): Promise<Justificativa> {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser aprovadas');
    }

    return this.justificativaRepo.updateStatus(id, 'aprovada', userId);
  }

  /**
   * Rejeita uma justificativa individual
   * Atualiza status da falta para 'indeferida'
   */
  async rejeitar(id: number, userId: string): Promise<Justificativa> {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser rejeitadas');
    }

    return this.justificativaRepo.updateStatus(id, 'rejeitada', userId);
  }

  /**
   * Busca justificativas por falta
   */
  async getByFaltaId(faltaId: number): Promise<Justificativa[]> {
    return this.justificativaRepo.findByFaltaId(faltaId);
  }

  // getById vem da classe abstrata
}
