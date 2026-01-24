/**
 * Selects Prisma reutilizáveis para queries de veículo
 */

/** Select para listagem, detalhe, create e update (com tipoVeiculo e contrato) */
export const VEICULO_LIST_SELECT = {
  id: true,
  placa: true,
  modelo: true,
  ano: true,
  tipoVeiculoId: true,
  tipoVeiculo: { select: { id: true, nome: true } },
  contratoId: true,
  contrato: { select: { id: true, nome: true, numero: true } },
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  deletedAt: true,
  deletedBy: true,
} as const;

/** Select para sincronização mobile (sem relações) */
export const VEICULO_SYNC_SELECT = {
  id: true,
  placa: true,
  modelo: true,
  ano: true,
  tipoVeiculoId: true,
  contratoId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  deletedAt: true,
  deletedBy: true,
} as const;
