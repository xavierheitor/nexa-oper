/**
 * Decorator para Obter Contratos do Usuário
 *
 * Este decorator extrai e injeta automaticamente os contratos permitidos
 * para o usuário autenticado, facilitando o acesso a essa informação
 * nos controladores.
 *
 * PADRÕES IMPLEMENTADOS:
 * - Injeção automática de dados
 * - Cache transparente
 * - Tratamento de erros gracioso
 * - Type safety
 *
 * @example
 * ```typescript
 * @Get('meus-contratos')
 * async getMyContracts(@GetUserContracts() contracts: ContractPermission[]) {
 *   return contracts;
 * }
 * ```
 */

import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';
import {
  ContractPermissionsService,
  ContractPermission,
} from '../service/contract-permissions.service';

export const GetUserContracts = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext
  ): Promise<ContractPermission[]> => {
    const logger = new Logger('GetUserContracts');
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      logger.warn('Usuário não autenticado tentando obter contratos');
      return [];
    }

    try {
      // Verificar se já está no cache da requisição
      if (request.userContracts) {
        logger.debug(`Cache hit para contratos do usuário ${user.id}`);
        return request.userContracts;
      }

      // Obter serviço de permissões do container de injeção de dependência
      const contractPermissionsService = request.app?.get(
        ContractPermissionsService
      );
      if (!contractPermissionsService) {
        logger.error(
          'ContractPermissionsService não encontrado no container de DI'
        );
        return [];
      }

      // Buscar contratos do usuário
      const result = await contractPermissionsService.getUserContracts(user.id);

      // Cache no contexto da requisição
      request.userContracts = result.contracts;

      logger.log(
        `Injetados ${result.contracts.length} contratos para usuário ${user.id}`
      );
      return result.contracts;
    } catch (error) {
      logger.error(`Erro ao obter contratos do usuário ${user.id}:`, error);
      return [];
    }
  }
);

/**
 * Decorator para obter informações completas dos contratos do usuário
 * Inclui metadados como total de contratos
 */
export const GetUserContractsInfo = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext) => {
    const logger = new Logger('GetUserContractsInfo');
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      logger.warn(
        'Usuário não autenticado tentando obter informações de contratos'
      );
      return { userId: 0, contracts: [], total: 0 };
    }

    try {
      // Verificar se já está no cache da requisição
      if (request.userContractsInfo) {
        logger.debug(
          `Cache hit para informações de contratos do usuário ${user.id}`
        );
        return request.userContractsInfo;
      }

      // Obter serviço de permissões do container de injeção de dependência
      const contractPermissionsService = request.app?.get(
        ContractPermissionsService
      );
      if (!contractPermissionsService) {
        logger.warn(
          'ContractPermissionsService não encontrado no container de DI, retornando dados vazios'
        );
        return { userId: user.id, contracts: [], total: 0 };
      }

      // Buscar informações completas dos contratos do usuário
      const result = await contractPermissionsService.getUserContracts(user.id);

      // Cache no contexto da requisição
      request.userContractsInfo = result;

      logger.log(
        `Injetadas informações de ${result.total} contratos para usuário ${user.id}`
      );
      return result;
    } catch (error) {
      logger.error(
        `Erro ao obter informações de contratos do usuário ${user.id}:`,
        error
      );
      return { userId: user.id, contracts: [], total: 0 };
    }
  }
);
