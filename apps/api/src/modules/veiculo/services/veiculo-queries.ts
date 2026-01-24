/**
 * Helpers de query e data para veículo
 */

import type { PrismaClient } from '@nexa-oper/db';

import type { UserContext } from '@common/utils/audit';
import { createAuditData, updateAuditData } from '@common/utils/audit';
import { ORDER_CONFIG } from '@common/constants/veiculo';
import { buildPagination } from '@common/utils/pagination';
import { VEICULO_LIST_SELECT } from './veiculo-selects';
import type { CreateVeiculoDto, UpdateVeiculoDto } from '../dto';

export async function runFindAllQuery(
  prisma: PrismaClient,
  where: Record<string, unknown>,
  page: number,
  limit: number
) {
  const { skip, take, page: currPage, pageSize } = buildPagination({
    page,
    pageSize: limit,
  });
  const [data, total] = await Promise.all([
    prisma.veiculo.findMany({
      where,
      orderBy: ORDER_CONFIG.DEFAULT_ORDER,
      skip,
      take,
      select: VEICULO_LIST_SELECT,
    }),
    prisma.veiculo.count({ where }),
  ]);
  return { data, total, currPage, pageSize };
}

export function buildCreateVeiculoData(
  dto: CreateVeiculoDto,
  userContext: UserContext
) {
  return {
    placa: dto.placa.toUpperCase(),
    modelo: dto.modelo.trim(),
    ano: dto.ano,
    tipoVeiculo: { connect: { id: dto.tipoVeiculoId } },
    contrato: { connect: { id: dto.contratoId } },
    ...createAuditData(userContext),
  };
}

export function buildUpdateVeiculoData(
  dto: UpdateVeiculoDto,
  userContext: UserContext
) {
  return {
    ...(dto.placa && { placa: dto.placa.toUpperCase() }),
    ...(dto.modelo && { modelo: dto.modelo.trim() }),
    ...(dto.ano != null && { ano: dto.ano }),
    ...(dto.tipoVeiculoId && {
      tipoVeiculo: { connect: { id: dto.tipoVeiculoId } },
    }),
    ...(dto.contratoId && {
      contrato: { connect: { id: dto.contratoId } },
    }),
    ...updateAuditData(userContext),
  };
}
