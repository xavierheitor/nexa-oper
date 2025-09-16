/**
 * Decorators de Permissão de Contrato
 *
 * Este arquivo contém decorators elegantes e intuitivos para configurar
 * verificações de permissão de contrato em controladores de forma limpa
 * e expressiva. Implementa um sistema declarativo que facilita a aplicação
 * de verificações de segurança em endpoints da API.
 *
 * ARQUITETURA:
 * - Decorators declarativos para configuração
 * - Integração automática com Guards
 * - Configuração flexível via opções
 * - Type safety completo
 *
 * DECORATORS DISPONÍVEIS:
 * - @RequireContractPermission: Verificação obrigatória para um contrato
 * - @RequireAnyContractPermission: Verificação para qualquer um dos contratos
 * - @RequireAllContractPermissions: Verificação para todos os contratos
 * - @OptionalContractPermission: Verificação opcional (não falha se não fornecido)
 * - @CustomContractPermission: Verificação com configuração customizada
 *
 * PADRÕES IMPLEMENTADOS:
 * - API fluente e intuitiva
 * - Configuração flexível via opções
 * - Documentação automática via JSDoc
 * - Type safety completo
 * - Integração transparente com Guards
 *
 * SEGURANÇA:
 * - Verificação automática de permissões
 * - Configuração declarativa de segurança
 * - Tratamento de erros padronizado
 * - Logs de auditoria integrados
 *
 * @example
 * ```typescript
 * // Verificação simples
 * @RequireContractPermission('contratoId')
 * async getContractData(@Param('contratoId') contratoId: number) {}
 *
 * // Verificação múltipla com configuração customizada
 * @RequireAnyContractPermission('contratoIds', { bodyPath: 'data.contractIds' })
 * async getMultipleContracts(@Body() body: any) {}
 *
 * // Verificação opcional
 * @OptionalContractPermission('contratoId')
 * async getOptionalContractData(@Query('contratoId') contratoId?: number) {}
 * ```
 *
 * @fileoverview Decorators para verificação de permissões de contrato
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import {
  ContractPermissionsGuard,
  ContractPermissionOptions,
} from '../guard/contract-permissions.guard';

export const CONTRACT_PERMISSION_KEY = 'contract_permission';

/**
 * Decorator base para configuração de permissões de contrato
 *
 * Este é o decorator interno que configura a verificação de permissões
 * e aplica o guard necessário. É usado pelos decorators públicos
 * para manter consistência na configuração.
 *
 * @param paramName - Nome do parâmetro que contém o ID do contrato
 * @param options - Opções de configuração da verificação
 * @returns Decorator configurado para verificação de permissões
 */
const ContractPermission = (
  paramName: string,
  options?: ContractPermissionOptions
) => {
  return applyDecorators(
    SetMetadata(CONTRACT_PERMISSION_KEY, { paramName, options }),
    UseGuards(ContractPermissionsGuard)
  );
};

/**
 * Verifica se o usuário tem permissão para acessar um contrato específico
 *
 * Este decorator implementa verificação obrigatória de permissão para um
 * contrato específico. É o decorator mais comum para proteção de endpoints
 * que trabalham com contratos individuais.
 *
 * CARACTERÍSTICAS:
 * - Verificação obrigatória (falha se parâmetro não fornecido)
 * - Modo 'single' (verifica um contrato específico)
 * - Configuração flexível via opções
 * - Integração automática com Guards
 *
 * @param paramName - Nome do parâmetro que contém o ID do contrato
 * @param options - Opções adicionais de configuração
 * @returns Decorator configurado para verificação obrigatória
 *
 * @example
 * ```typescript
 * // Verificação básica
 * @RequireContractPermission('contratoId')
 * async getContractData(@Param('contratoId') contratoId: number) {}
 *
 * // Verificação com configuração customizada
 * @RequireContractPermission('contratoId', { bodyPath: 'data.contractId' })
 * async getContractFromBody(@Body() body: any) {}
 * ```
 */
export const RequireContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>
) => {
  return ContractPermission(paramName, {
    mode: 'single',
    required: true,
    ...options,
  });
};

/**
 * Verifica se o usuário tem permissão para acessar qualquer um dos contratos fornecidos
 *
 * @param paramName - Nome do parâmetro que contém os IDs dos contratos
 * @param options - Opções adicionais de configuração
 *
 * @example
 * ```typescript
 * @RequireAnyContractPermission('contratoIds')
 * async getMultipleContracts(@Body() body: { contratoIds: number[] }) {}
 * ```
 */
export const RequireAnyContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>
) => {
  return ContractPermission(paramName, {
    mode: 'any',
    required: true,
    ...options,
  });
};

/**
 * Verifica se o usuário tem permissão para acessar todos os contratos fornecidos
 *
 * @param paramName - Nome do parâmetro que contém os IDs dos contratos
 * @param options - Opções adicionais de configuração
 *
 * @example
 * ```typescript
 * @RequireAllContractPermissions('contratoIds')
 * async getMultipleContracts(@Body() body: { contratoIds: number[] }) {}
 * ```
 */
export const RequireAllContractPermissions = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>
) => {
  return ContractPermission(paramName, {
    mode: 'all',
    required: true,
    ...options,
  });
};

/**
 * Verifica permissão de contrato de forma opcional (não falha se parâmetro não fornecido)
 *
 * @param paramName - Nome do parâmetro que contém o ID do contrato
 * @param options - Opções adicionais de configuração
 *
 * @example
 * ```typescript
 * @OptionalContractPermission('contratoId')
 * async getOptionalContractData(@Query('contratoId') contratoId?: number) {}
 * ```
 */
export const OptionalContractPermission = (
  paramName: string,
  options?: Partial<ContractPermissionOptions>
) => {
  return ContractPermission(paramName, {
    mode: 'single',
    required: false,
    ...options,
  });
};

/**
 * Decorator para listar contratos permitidos para o usuário
 * Não verifica permissão, apenas adiciona os contratos do usuário ao contexto
 *
 * @example
 * ```typescript
 * @ListUserContracts()
 * async getUserContracts(@GetUsuarioMobileId() userId: number) {}
 * ```
 */
export const ListUserContracts = () => {
  return applyDecorators(
    SetMetadata('list_user_contracts', true),
    UseGuards(ContractPermissionsGuard)
  );
};

/**
 * Decorator para verificação customizada de permissões
 *
 * @param paramName - Nome do parâmetro
 * @param options - Configuração completa
 *
 * @example
 * ```typescript
 * @CustomContractPermission('contratoId', {
 *   mode: 'any',
 *   bodyPath: 'data.contracts',
 *   required: true
 * })
 * async customCheck(@Body() body: any) {}
 * ```
 */
export const CustomContractPermission = (
  paramName: string,
  options: ContractPermissionOptions
) => {
  return ContractPermission(paramName, options);
};
