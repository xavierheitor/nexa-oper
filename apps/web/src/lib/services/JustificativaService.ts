/**
 * Serviço para Justificativas Individuais (Eletricista)
 *
 * Implementa lógica de negócio para justificativas de faltas individuais
 */

import { JustificativaRepository } from '../repositories/JustificativaRepository';
import type { CriarJustificativaInput, ListarJustificativasInput } from '../schemas/justificativaSchema';

export class JustificativaService {
  private repo: JustificativaRepository;

  constructor() {
    this.repo = new JustificativaRepository();
  }

  /**
   * Cria uma nova justificativa individual e vincula à falta
   */
  async create(data: CriarJustificativaInput, userId: string) {
    return this.repo.create({
      faltaId: data.faltaId,
      tipoJustificativaId: data.tipoJustificativaId,
      descricao: data.descricao,
      createdBy: userId,
    });
  }

  /**
   * Aprova uma justificativa individual
   * Atualiza status da falta para 'justificada'
   */
  async aprovar(id: number, userId: string) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser aprovadas');
    }

    return this.repo.updateStatus(id, 'aprovada', userId);
  }

  /**
   * Rejeita uma justificativa individual
   * Atualiza status da falta para 'indeferida'
   */
  async rejeitar(id: number, userId: string) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser rejeitadas');
    }

    return this.repo.updateStatus(id, 'rejeitada', userId);
  }

  /**
   * Lista justificativas individuais com filtros
   */
  async list(params: ListarJustificativasInput) {
    const { dataInicio, dataFim, ...rest } = params;

    return this.repo.list({
      ...rest,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      orderBy: 'createdAt',
      orderDir: 'desc',
    });
  }

  /**
   * Busca justificativa individual por ID
   */
  async getById(id: number) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }
    return justificativa;
  }

  /**
   * Busca justificativas por falta
   */
  async getByFaltaId(faltaId: number) {
    return this.repo.findByFaltaId(faltaId);
  }
}

