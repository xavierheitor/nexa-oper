/**
 * Serviço para Faltas
 *
 * Implementa lógica de negócio para faltas
 */

import { Falta } from '@nexa-oper/db';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { FaltaRepository } from '../../repositories/turnos/FaltaRepository';
import { FaltaFilter as FaltaFilterSchema } from '../../schemas/turnoRealizadoSchema';
import { PaginatedResult } from '../../types/common';

// Tipo de filtro compatível com PaginationParams
type FaltaFilter = Omit<FaltaFilterSchema, 'orderBy' | 'orderDir'> & {
  orderBy: string;
  orderDir: 'asc' | 'desc';
};

export class FaltaService extends AbstractCrudService<
  { id: number }, // Stub para create (nunca usado)
  { id: number }, // Stub para update (nunca usado)
  FaltaFilter,
  Falta
> {
  constructor() {
    // Cast necessário porque FaltaRepository.create aceita Prisma.FaltaCreateInput
    // mas AbstractCrudService espera uma interface genérica
    super(new FaltaRepository() as any);
  }

  async create(_data: { id: number }, _userId: string): Promise<Falta> {
    throw new Error('Faltas não podem ser criadas diretamente pelo service. Use o sistema de escala.');
  }

  async update(_data: { id: number }, _userId: string): Promise<Falta> {
    throw new Error('Faltas não podem ser atualizadas diretamente pelo service.');
  }

  /**
   * Lista faltas com filtros
   * Converte dataInicio e dataFim de string para Date se necessário
   */
  async list(params: Partial<FaltaFilter> & FaltaFilterSchema): Promise<PaginatedResult<Falta>> {
    const { dataInicio, dataFim, ...rest } = params;

    const filterParams: FaltaFilter = {
      ...rest,
      orderBy: 'id',
      orderDir: 'desc',
      ...(dataInicio && { dataInicio: typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio }),
      ...(dataFim && { dataFim: typeof dataFim === 'string' ? new Date(dataFim) : dataFim }),
    };

    return super.list(filterParams);
  }

  // getById vem da classe abstrata
}
