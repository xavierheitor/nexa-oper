/**
 * Constrói filtros WHERE para consultas de veículo
 */

import {
  buildBaseWhereClause,
  buildSearchWhereClause,
  buildContractFilter,
} from '@common/utils/where-clause';

export function buildVeiculoWhereClause(
  search: string | undefined,
  tipoVeiculoId: number | undefined,
  contratoId: number | undefined,
  allowedContractIds: number[] | null
) {
  const where: Record<string, unknown> = buildBaseWhereClause();
  const searchFilter = buildSearchWhereClause(search, {
    placa: true,
    modelo: true,
  });
  if (searchFilter) Object.assign(where, searchFilter);
  if (tipoVeiculoId) where.tipoVeiculoId = tipoVeiculoId;
  const contractFilter = buildContractFilter(contratoId, allowedContractIds);
  if (contractFilter) Object.assign(where, contractFilter);
  return where;
}
