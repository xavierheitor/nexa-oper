/**
 * Serviço para Horas Extras
 *
 * Implementa lógica de negócio para horas extras
 */

import { HoraExtraRepository } from '../repositories/HoraExtraRepository';

export class HoraExtraService {
  private repo: HoraExtraRepository;

  constructor() {
    this.repo = new HoraExtraRepository();
  }

  /**
   * Lista horas extras com filtros
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
   * Busca hora extra por ID
   */
  async getById(id: number) {
    const horaExtra = await this.repo.findById(id);
    if (!horaExtra) {
      throw new Error('Hora extra não encontrada');
    }
    return horaExtra;
  }

  /**
   * Aprova uma hora extra
   */
  async aprovar(id: number, userId: string) {
    return this.repo.updateStatus(id, 'aprovada', userId);
  }

  /**
   * Rejeita uma hora extra
   */
  async rejeitar(id: number, userId: string) {
    return this.repo.updateStatus(id, 'rejeitada', userId);
  }
}

