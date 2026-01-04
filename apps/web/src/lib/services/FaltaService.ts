/**
 * Serviço para Faltas
 *
 * Implementa lógica de negócio para faltas
 */

import { FaltaRepository } from '../repositories/turnos/FaltaRepository';

export class FaltaService {
  private repo: FaltaRepository;

  constructor() {
    this.repo = new FaltaRepository();
  }

  /**
   * Lista faltas com filtros
   */
  async list(params: any) {
    const { dataInicio, dataFim, ...rest } = params;

    return this.repo.list({
      ...rest,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }

  /**
   * Busca falta por ID
   */
  async getById(id: number) {
    const falta = await this.repo.findById(id);
    if (!falta) {
      throw new Error('Falta não encontrada');
    }
    return falta;
  }
}

