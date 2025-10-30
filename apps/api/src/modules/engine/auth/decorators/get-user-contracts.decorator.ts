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
  ContractPermissionsService,
} from '../services/contract-permissions.service';
import { sanitizeData } from '@common/utils/logger';

export const GetUserContracts = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext
  ): Promise<ContractPermission[]> => {
    const logger = new Logger('GetUserContracts');
    logger.verbose('=== INÍCIO GetUserContracts DECORATOR ===');
    logger.verbose(`Timestamp: ${new Date().toISOString()}`);
    logger.verbose(`data recebido: ${JSON.stringify(data)}`);
    logger.verbose(`ExecutionContext tipo: ${ctx.getType()}`);

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    logger.verbose('=== DADOS DA REQUISIÇÃO ===');
    logger.verbose(`Request object keys: ${Object.keys(request).join(', ')}`);
    // Sanitiza dados do usuário para evitar exposição de informações sensíveis
    logger.verbose(`User object: ${JSON.stringify(sanitizeData(user))}`);
    logger.verbose(`User ID: ${user?.id}`);
    logger.verbose(`User tipo: ${typeof user}`);
    logger.verbose(`User é null: ${user === null}`);
    logger.verbose(`User é undefined: ${user === undefined}`);

    if (!user || !user.id) {
      logger.warn('=== USUÁRIO NÃO AUTENTICADO ===');
      logger.warn('Usuário não autenticado tentando obter contratos');
      logger.warn('Retornando array vazio');
      return [];
    }

    try {
      logger.verbose('=== VERIFICANDO CACHE ===');
      // Verificar se já está no cache da requisição
      if (request.userContracts) {
        logger.verbose(`Cache hit para contratos do usuário ${user.id}`);
        // Sanitiza contratos para evitar exposição de informações sensíveis
        logger.verbose(
          `Contratos do cache: ${JSON.stringify(sanitizeData(request.userContracts))}`
        );
        logger.verbose(
          `Tipo dos contratos do cache: ${typeof request.userContracts}`
        );
        logger.verbose(`É array: ${Array.isArray(request.userContracts)}`);
        logger.verbose(`Quantidade: ${request.userContracts?.length || 0}`);
        logger.verbose('=== RETORNANDO DO CACHE ===');
        return request.userContracts;
      }

      logger.verbose('=== BUSCANDO SERVIÇO ===');
      // Obter serviço de permissões via injeção de dependência
      logger.verbose('Buscando ContractPermissionsService...');
      let contractPermissionsService = request.app.get?.(ContractPermissionsService);
      if (!contractPermissionsService) {
        const appCtx = (global as any).NEST_APP;
        contractPermissionsService = appCtx?.get?.(ContractPermissionsService, { strict: false });
      }

      if (!contractPermissionsService) {
        logger.error('=== SERVIÇO NÃO ENCONTRADO ===');
        logger.error(
          'ContractPermissionsService não encontrado no container de DI'
        );
        return [];
      }

      logger.verbose(
        `ContractPermissionsService encontrado: ${!!contractPermissionsService}`
      );
      logger.verbose(`Tipo do serviço: ${typeof contractPermissionsService}`);

      logger.verbose('=== CHAMANDO getUserContracts ===');
      // Buscar contratos do usuário
      logger.verbose(`Chamando getUserContracts para usuário ${user.id}...`);
      const result = await contractPermissionsService.getUserContracts(user.id);

      logger.verbose('=== RESULTADO getUserContracts ===');
      logger.verbose(`Resultado getUserContracts: ${JSON.stringify(result)}`);
      logger.verbose(`Tipo do resultado: ${typeof result}`);
      logger.verbose(`Resultado é null: ${result === null}`);
      logger.verbose(`Resultado é undefined: ${result === undefined}`);
      logger.verbose(`Contratos retornados: ${result?.contracts?.length || 0}`);
      logger.verbose(`Tipo dos contratos: ${typeof result?.contracts}`);
      logger.verbose(`Contratos é array: ${Array.isArray(result?.contracts)}`);

      if (result?.contracts && result.contracts.length > 0) {
        logger.debug('=== DETALHES DOS CONTRATOS ===');
        result.contracts.forEach((contract: ContractPermission, index: number) => {
          // Sanitiza contrato para evitar exposição de informações sensíveis
          logger.debug(
            `Contrato ${index + 1}: ${JSON.stringify(sanitizeData(contract))}`
          );
        });
      }

      // Cache no contexto da requisição
      logger.debug('=== SALVANDO NO CACHE ===');
      request.userContracts = result.contracts;
      // Sanitiza cache para evitar exposição de informações sensíveis
      logger.debug(
        `Cache salvo: ${JSON.stringify(sanitizeData(request.userContracts))}`
      );

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

      // Obter serviço de permissões via injeção de dependência
      const contractPermissionsService = request.app.get(ContractPermissionsService);

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
