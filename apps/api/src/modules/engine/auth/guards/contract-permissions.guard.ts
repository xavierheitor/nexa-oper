/**
 * Guard de Permissões de Contrato
 *
 * Este guard verifica se o usuário autenticado tem permissão para acessar
 * recursos relacionados a contratos específicos. Funciona de forma elegante
 * e flexível, permitindo diferentes tipos de verificação.
 *
 * TIPOS DE VERIFICAÇÃO:
 * - Single Contract: Verifica permissão para um contrato específico
 * - Multiple Contracts: Verifica permissão para qualquer um dos contratos
 * - User Contracts: Lista todos os contratos permitidos para o usuário
 *
 * PADRÕES IMPLEMENTADOS:
 * - Decorator-based configuration
 * - Flexible parameter extraction
 * - Comprehensive logging
 * - Graceful error handling
 * - Cache integration
 *
 * @example
 * ```typescript
 * // Verificação simples
 * @UseGuards(ContractPermissionsGuard)
 * @ContractPermission('contratoId')
 * async getContractData(@Param('contratoId') contratoId: number) {}
 *
 * // Verificação múltipla
 * @UseGuards(ContractPermissionsGuard)
 * @ContractPermission('contratoIds', { mode: 'any' })
 * async getMultipleContracts(@Body() body: { contratoIds: number[] }) {}
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ContractPermissionsService } from '../services/contract-permissions.service';

export interface ContractPermissionOptions {
  mode?: 'single' | 'any' | 'all';
  paramName?: string;
  bodyPath?: string;
  required?: boolean;
}

export const CONTRACT_PERMISSION_KEY = 'contract_permission';
export const ContractPermission = (
  paramName: string,
  options?: ContractPermissionOptions
) => {
  return (target: any, propertyKey: string) => {
    Reflect.defineMetadata(
      CONTRACT_PERMISSION_KEY,
      {
        paramName,
        options: {
          mode: 'single',
          required: true,
          ...options,
        },
      },
      target,
      propertyKey
    );
  };
};

@Injectable()
export class ContractPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(ContractPermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly contractPermissionsService: ContractPermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar se usuário está autenticado
    if (!user || !user.id) {
      this.logger.warn(
        'Usuário não autenticado tentando acessar recurso protegido'
      );
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Obter configuração do decorator
    const permissionConfig = this.reflector.get<{
      paramName: string;
      options: ContractPermissionOptions;
    }>(CONTRACT_PERMISSION_KEY, context.getHandler());

    // Se não há configuração de permissão, permitir acesso
    if (!permissionConfig) {
      this.logger.debug(
        `Nenhuma verificação de permissão configurada para ${context.getHandler().name}`
      );
      return true;
    }

    const { paramName, options } = permissionConfig;
    const userId = user.id;

    try {
      // Extrair parâmetros baseado na configuração
      const contractData = this.extractContractData(
        request,
        paramName,
        options
      );

      if (!contractData && options.required) {
        this.logger.warn(
          `Parâmetro de contrato '${paramName}' não encontrado para usuário ${userId}`
        );
        throw new BadRequestException(`Parâmetro '${paramName}' é obrigatório`);
      }

      if (!contractData) {
        this.logger.debug(
          `Parâmetro de contrato '${paramName}' não fornecido, permitindo acesso`
        );
        return true;
      }

      // Verificar permissões baseado no modo
      const hasPermission = await this.checkPermission(
        userId,
        contractData,
        options
      );

      if (!hasPermission) {
        this.logger.warn(
          `Acesso NEGADO: usuário ${userId} não tem permissão para contrato(s) ${JSON.stringify(contractData)}`
        );
        throw new ForbiddenException(
          'Você não tem permissão para acessar este contrato'
        );
      }

      this.logger.log(
        `Acesso CONCEDIDO: usuário ${userId} tem permissão para contrato(s) ${JSON.stringify(contractData)}`
      );
      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao verificar permissões para usuário ${userId}:`,
        error
      );
      throw new ForbiddenException('Erro interno ao verificar permissões');
    }
  }

  /**
   * Extrai dados de contrato da requisição baseado na configuração
   */
  private extractContractData(
    request: any,
    paramName: string,
    options: ContractPermissionOptions
  ): number | number[] | null {
    const { bodyPath } = options;

    // Tentar extrair do parâmetro da URL primeiro
    let contractData = request.params[paramName] || request.query[paramName];

    // Se não encontrou e há bodyPath configurado, tentar extrair do body
    if (!contractData && bodyPath) {
      contractData = this.getNestedValue(request.body, bodyPath);
    }

    // Converter para número se necessário
    if (contractData) {
      if (Array.isArray(contractData)) {
        return contractData
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
      }
      const numValue = parseInt(contractData, 10);
      return isNaN(numValue) ? null : numValue;
    }

    return null;
  }

  /**
   * Obtém valor aninhado de um objeto usando notação de ponto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Verifica permissões baseado no modo configurado
   */
  private async checkPermission(
    userId: number,
    contractData: number | number[],
    options: ContractPermissionOptions
  ): Promise<boolean> {
    const { mode = 'single' } = options;

    switch (mode) {
      case 'single': {
        if (typeof contractData !== 'number') {
          this.logger.warn(
            `Modo 'single' espera número, recebido: ${typeof contractData}`
          );
          return false;
        }
        return await this.contractPermissionsService.hasContractPermission(
          userId,
          contractData
        );
      }

      case 'any': {
        if (!Array.isArray(contractData)) {
          this.logger.warn(
            `Modo 'any' espera array, recebido: ${typeof contractData}`
          );
          return false;
        }
        return await this.contractPermissionsService.hasAnyContractPermission(
          userId,
          contractData
        );
      }

      case 'all': {
        if (!Array.isArray(contractData)) {
          this.logger.warn(
            `Modo 'all' espera array, recebido: ${typeof contractData}`
          );
          return false;
        }
        // Para modo 'all', verificar se tem permissão para todos os contratos
        const permissions = await Promise.all(
          contractData.map(contractId =>
            this.contractPermissionsService.hasContractPermission(
              userId,
              contractId
            )
          )
        );
        return permissions.every(hasPermission => hasPermission);
      }

      default: {
        this.logger.warn(`Modo de verificação desconhecido: ${String(mode)}`);
        return false;
      }
    }
  }
}
