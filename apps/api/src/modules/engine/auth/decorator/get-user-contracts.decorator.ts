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
  ContractPermission,
  getContractPermissionsService,
} from '../service/contract-permissions.service';

export const GetUserContracts = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext
  ): Promise<ContractPermission[]> => {
    const logger = new Logger('GetUserContracts');
    logger.debug('=== INÍCIO GetUserContracts DECORATOR ===');
    logger.debug(`Timestamp: ${new Date().toISOString()}`);
    logger.debug(`data recebido: ${JSON.stringify(data)}`);
    logger.debug(`ExecutionContext tipo: ${ctx.getType()}`);

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    logger.debug('=== DADOS DA REQUISIÇÃO ===');
    logger.debug(`Request object keys: ${Object.keys(request).join(', ')}`);
    logger.debug(`User object: ${JSON.stringify(user)}`);
    logger.debug(`User ID: ${user?.id}`);
    logger.debug(`User tipo: ${typeof user}`);
    logger.debug(`User é null: ${user === null}`);
    logger.debug(`User é undefined: ${user === undefined}`);

    if (!user || !user.id) {
      logger.warn('=== USUÁRIO NÃO AUTENTICADO ===');
      logger.warn('Usuário não autenticado tentando obter contratos');
      logger.warn('Retornando array vazio');
      return [];
    }

    try {
      logger.debug('=== VERIFICANDO CACHE ===');
      // Verificar se já está no cache da requisição
      if (request.userContracts) {
        logger.debug(`Cache hit para contratos do usuário ${user.id}`);
        logger.debug(
          `Contratos do cache: ${JSON.stringify(request.userContracts)}`
        );
        logger.debug(
          `Tipo dos contratos do cache: ${typeof request.userContracts}`
        );
        logger.debug(`É array: ${Array.isArray(request.userContracts)}`);
        logger.debug(`Quantidade: ${request.userContracts?.length || 0}`);
        logger.debug('=== RETORNANDO DO CACHE ===');
        return request.userContracts;
      }

      logger.debug('=== BUSCANDO SERVIÇO ===');
      // Obter serviço de permissões via singleton
      logger.debug('Buscando ContractPermissionsService...');
      const contractPermissionsService = getContractPermissionsService();

      if (!contractPermissionsService) {
        logger.error('=== SERVIÇO NÃO ENCONTRADO ===');
        logger.error(
          'ContractPermissionsService não encontrado no container de DI'
        );
        return [];
      }

      logger.debug(
        `ContractPermissionsService encontrado: ${!!contractPermissionsService}`
      );
      logger.debug(`Tipo do serviço: ${typeof contractPermissionsService}`);

      logger.debug('=== CHAMANDO getUserContracts ===');
      // Buscar contratos do usuário
      logger.debug(`Chamando getUserContracts para usuário ${user.id}...`);
      const result = await contractPermissionsService.getUserContracts(user.id);

      logger.debug('=== RESULTADO getUserContracts ===');
      logger.debug(`Resultado getUserContracts: ${JSON.stringify(result)}`);
      logger.debug(`Tipo do resultado: ${typeof result}`);
      logger.debug(`Resultado é null: ${result === null}`);
      logger.debug(`Resultado é undefined: ${result === undefined}`);
      logger.debug(`Contratos retornados: ${result?.contracts?.length || 0}`);
      logger.debug(`Tipo dos contratos: ${typeof result?.contracts}`);
      logger.debug(`Contratos é array: ${Array.isArray(result?.contracts)}`);

      if (result?.contracts && result.contracts.length > 0) {
        logger.debug('=== DETALHES DOS CONTRATOS ===');
        result.contracts.forEach((contract, index) => {
          logger.debug(`Contrato ${index + 1}: ${JSON.stringify(contract)}`);
        });
      }

      // Cache no contexto da requisição
      logger.debug('=== SALVANDO NO CACHE ===');
      request.userContracts = result.contracts;
      logger.debug(`Cache salvo: ${JSON.stringify(request.userContracts)}`);

      logger.log(
        `Injetados ${result.contracts.length} contratos para usuário ${user.id}`
      );
      logger.debug('=== RETORNANDO CONTRATOS ===');
      logger.debug('=== FIM GetUserContracts DECORATOR ===');
      return result.contracts;
    } catch (error) {
      logger.error('=== ERRO NO DECORATOR ===');
      logger.error(`Erro ao obter contratos do usuário ${user.id}:`, error);
      logger.error(`Mensagem do erro: ${error.message}`);
      logger.error(`Nome do erro: ${error.name}`);
      logger.error(`Stack trace: ${error.stack}`);
      logger.error(`Código do erro: ${error.code}`);
      logger.error('=== RETORNANDO ARRAY VAZIO POR ERRO ===');
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

      // Obter serviço de permissões via singleton
      const contractPermissionsService = getContractPermissionsService();

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
      request.contractPermissionsService = contractPermissionsService;

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
