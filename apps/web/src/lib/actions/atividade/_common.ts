import { Prisma } from '@nexa-oper/db';
import { z } from 'zod';

export const atividadeDashboardBaseFilterSchema = z.object({
  turnoId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  veiculoId: z.number().int().positive().optional(),
  eletricistaId: z.number().int().positive().optional(),
  tipoAtividadeId: z.number().int().positive().optional(),
  tipoAtividadeServicoId: z.number().int().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  turnoDia: z.coerce.date().optional(),
});

export type AtividadeDashboardBaseFilter = z.infer<
  typeof atividadeDashboardBaseFilterSchema
>;

export function buildAtividadeExecucaoWhere(
  filters: AtividadeDashboardBaseFilter
): Prisma.AtividadeExecucaoWhereInput {
  const where: Prisma.AtividadeExecucaoWhereInput = {
    deletedAt: null,
  };

  if (filters.tipoAtividadeId) {
    where.tipoAtividadeId = filters.tipoAtividadeId;
  }

  if (filters.tipoAtividadeServicoId) {
    where.tipoAtividadeServicoId = filters.tipoAtividadeServicoId;
  }

  if (filters.turnoId) {
    where.turnoId = filters.turnoId;
  }

  const turnoFilters: Prisma.TurnoWhereInput = {};

  if (filters.equipeId) {
    turnoFilters.equipeId = filters.equipeId;
  }

  if (filters.veiculoId) {
    turnoFilters.veiculoId = filters.veiculoId;
  }

  if (filters.eletricistaId) {
    turnoFilters.TurnoEletricistas = {
      some: {
        eletricistaId: filters.eletricistaId,
        deletedAt: null,
      },
    };
  }

  const turnoDateFilter: Prisma.DateTimeFilter = {};
  if (filters.turnoDia) {
    const inicio = new Date(filters.turnoDia);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(filters.turnoDia);
    fim.setHours(23, 59, 59, 999);
    turnoDateFilter.gte = inicio;
    turnoDateFilter.lte = fim;
  } else {
    if (filters.dataInicio) {
      const inicio = new Date(filters.dataInicio);
      inicio.setHours(0, 0, 0, 0);
      turnoDateFilter.gte = inicio;
    }

    if (filters.dataFim) {
      const fim = new Date(filters.dataFim);
      fim.setHours(23, 59, 59, 999);
      turnoDateFilter.lte = fim;
    }
  }

  if (Object.keys(turnoDateFilter).length > 0) {
    turnoFilters.dataInicio = turnoDateFilter;
  }

  if (Object.keys(turnoFilters).length > 0) {
    where.turno = { is: turnoFilters };
  }

  return where;
}
