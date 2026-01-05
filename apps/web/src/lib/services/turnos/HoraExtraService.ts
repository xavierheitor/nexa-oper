/**
 * Serviço para Horas Extras
 *
 * Implementa lógica de negócio para horas extras
 */

import { HoraExtra } from '@nexa-oper/db';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { HoraExtraRepository } from '../../repositories/turnos/HoraExtraRepository';
import { HoraExtraFilter as HoraExtraFilterSchema } from '../../schemas/turnoRealizadoSchema';
import { PaginatedResult } from '../../types/common';

// Tipo de filtro compatível com PaginationParams
type HoraExtraFilter = Omit<HoraExtraFilterSchema, 'orderBy' | 'orderDir'> & {
  orderBy: string;
  orderDir: 'asc' | 'desc';
};

export class HoraExtraService extends AbstractCrudService<
  { id: number }, // Stub para create (nunca usado)
  { id: number }, // Stub para update (nunca usado)
  HoraExtraFilter,
  HoraExtra
> {
  private horaExtraRepo: HoraExtraRepository;

  constructor() {
    const repo = new HoraExtraRepository();
    // Cast necessário porque HoraExtraRepository.create aceita Prisma.HoraExtraCreateInput
    // mas AbstractCrudService espera uma interface genérica
    super(repo as any);
    this.horaExtraRepo = repo;
  }

  async create(_data: { id: number }, _userId: string): Promise<HoraExtra> {
    throw new Error('Horas extras não podem ser criadas diretamente pelo service.');
  }

  async update(_data: { id: number }, _userId: string): Promise<HoraExtra> {
    throw new Error('Horas extras não podem ser atualizadas diretamente pelo service.');
  }

  /**
   * Lista horas extras com filtros
   * Converte dataInicio e dataFim de string para Date se necessário
   */
  async list(params: HoraExtraFilterSchema & { orderBy?: string; orderDir?: 'asc' | 'desc' }): Promise<PaginatedResult<HoraExtra>> {
    const { dataInicio, dataFim, orderBy, orderDir, ...rest } = params;

    // Converte datas de string/Date para Date se necessário
    const dataInicioDate = dataInicio ? (dataInicio instanceof Date ? dataInicio : new Date(dataInicio)) : undefined;
    const dataFimDate = dataFim ? (dataFim instanceof Date ? dataFim : new Date(dataFim)) : undefined;

    const filterParams: HoraExtraFilter = {
      page: rest.page ?? 1,
      pageSize: rest.pageSize ?? 20,
      orderBy: orderBy ?? 'id',
      orderDir: (orderDir ?? 'desc') as 'asc' | 'desc',
      ...(rest.eletricistaId && { eletricistaId: rest.eletricistaId }),
      ...(rest.tipo && { tipo: rest.tipo }),
      ...(rest.status && { status: rest.status }),
      ...(dataInicioDate && { dataInicio: dataInicioDate }),
      ...(dataFimDate && { dataFim: dataFimDate }),
    };

    return super.list(filterParams);
  }

  /**
   * Aprova uma hora extra
   */
  async aprovar(id: number, userId: string): Promise<HoraExtra> {
    return this.horaExtraRepo.updateStatus(id, 'aprovada', userId);
  }

  /**
   * Rejeita uma hora extra
   */
  async rejeitar(id: number, userId: string): Promise<HoraExtra> {
    return this.horaExtraRepo.updateStatus(id, 'rejeitada', userId);
  }

  // getById vem da classe abstrata
}
