import { ForbiddenException } from '@nestjs/common';

import { ContractPermission } from '../services/contract-permissions.service';

/**
 * Extrai IDs de contratos permitidos a partir da lista de permissões.
 * Retorna null quando não houver restrição (lista undefined),
 * e [] quando explicitamente sem permissões.
 */
export function extractAllowedContractIds(
  allowedContracts?: ContractPermission[]
): number[] | null {
  if (typeof allowedContracts === 'undefined') return null;
  if (!Array.isArray(allowedContracts)) return [];
  if (allowedContracts.length === 0) return [];
  return allowedContracts.map(c => c.contratoId);
}

/**
 * Garante que um contrato específico está entre os permitidos.
 */
export function ensureContractPermission(
  contratoId: number,
  allowedContractIds: number[] | null,
  forbiddenMessage = 'Você não tem permissão para acessar este contrato.'
): void {
  if (allowedContractIds && !allowedContractIds.includes(contratoId)) {
    throw new ForbiddenException(forbiddenMessage);
  }
}
