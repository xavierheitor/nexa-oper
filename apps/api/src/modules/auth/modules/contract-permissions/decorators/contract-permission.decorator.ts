import {
  applyDecorators,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContractPermissionsGuard } from '../guards/contract-permissions.guard';
import { UserContractsInterceptor } from '../interceptors/user-contracts.interceptor';
import {
  CONTRACT_PERMISSION_KEY,
  LIST_USER_CONTRACTS_KEY,
  type ContractPermissionOptions,
} from '../constants';

export type { ContractPermissionOptions };

const ContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>,
) =>
  applyDecorators(
    SetMetadata(CONTRACT_PERMISSION_KEY, { paramName, ...options }),
    UseGuards(ContractPermissionsGuard),
  );

/**
 * Verifica se o usuário tem permissão para acessar um contrato específico.
 */
export const RequireContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>,
) =>
  ContractPermission(paramName, { mode: 'single', required: true, ...options });

/**
 * Verifica se o usuário tem permissão para acessar qualquer um dos contratos fornecidos.
 */
export const RequireAnyContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>,
) => ContractPermission(paramName, { mode: 'any', required: true, ...options });

/**
 * Verifica se o usuário tem permissão para acessar todos os contratos fornecidos.
 */
export const RequireAllContractPermissions = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>,
) => ContractPermission(paramName, { mode: 'all', required: true, ...options });

/**
 * Verifica permissão de contrato de forma opcional (não falha se parâmetro não fornecido).
 */
export const OptionalContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>,
) =>
  ContractPermission(paramName, {
    mode: 'single',
    required: false,
    ...options,
  });

/**
 * Verificação customizada de permissões.
 */
export const CustomContractPermission = (
  paramName: string,
  options: ContractPermissionOptions,
) => ContractPermission(paramName, options);

/**
 * Permite listar contratos do usuário. Injeta os contratos no contexto.
 * Use com @GetUserContracts() ou @GetUserContractsInfo().
 */
export const ListUserContracts = () =>
  applyDecorators(
    SetMetadata(LIST_USER_CONTRACTS_KEY, true),
    UseGuards(ContractPermissionsGuard),
    UseInterceptors(UserContractsInterceptor),
  );
