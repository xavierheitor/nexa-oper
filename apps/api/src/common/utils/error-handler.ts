/**
 * Helper para Tratamento Padronizado de Erros em Serviços
 *
 * Este módulo fornece funções utilitárias para padronizar o tratamento
 * de erros em todos os serviços da aplicação, garantindo:
 * - Logging consistente
 * - Re-lançamento de exceções HTTP específicas
 * - Conversão de erros genéricos em exceções apropriadas
 * - Mensagens de erro consistentes usando ERROR_MESSAGES
 *
 * @example
 * ```typescript
 * try {
 *   // código do serviço
 * } catch (error) {
 *   handleServiceError(error, this.logger, 'Erro ao criar registro', ERROR_MESSAGES.CREATE_FAILED);
 * }
 * ```
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '@common/constants/errors';

/**
 * Verifica se um erro do Prisma é um erro de constraint única (P2002)
 * e retorna informações sobre qual campo causou o conflito
 */
export function isPrismaUniqueConstraintError(error: any): {
  isUniqueError: boolean;
  field?: string;
  target?: string[];
} {
  if (error?.code === 'P2002' && error?.meta?.target) {
    const target = Array.isArray(error.meta.target)
      ? error.meta.target
      : [error.meta.target];

    // Mapear campos do Prisma para mensagens de erro
    const fieldMap: Record<string, string> = {
      matricula: 'matricula',
      placa: 'placa',
      nome: 'nome',
    };

    const field = target.find((t: string) => fieldMap[t]);
    return {
      isUniqueError: true,
      field: field || target[0],
      target,
    };
  }

  return { isUniqueError: false };
}

/**
 * Trata erros de constraint única do Prisma e lança ConflictException apropriada
 *
 * IMPORTANTE: Esta função lança uma exceção se for erro de constraint única.
 * Se não for, ela não faz nada (não lança exceção), permitindo que o erro
 * seja tratado pelo handleCrudError ou handleServiceError.
 */
export function handlePrismaUniqueError(
  error: any,
  logger: Logger,
  entityName: string
): void {
  const uniqueError = isPrismaUniqueConstraintError(error);

  if (uniqueError.isUniqueError && uniqueError.field) {
    const fieldMessages: Record<string, string> = {
      matricula: ERROR_MESSAGES.MATRICULA_DUPLICATE,
      placa: ERROR_MESSAGES.PLACA_DUPLICATE,
      nome: ERROR_MESSAGES.NOME_DUPLICATE,
    };

    const errorMessage =
      fieldMessages[uniqueError.field] || ERROR_MESSAGES.NOME_DUPLICATE;

    logger.warn(
      `Tentativa de criar ${entityName} com ${uniqueError.field} duplicado`
    );
    throw new ConflictException(errorMessage);
  }

  // Se não for erro de constraint única, não faz nada (deixa o erro passar)
}

/**
 * Opções para tratamento de erro em serviços
 */
export interface HandleServiceErrorOptions {
  /** Mensagem de erro customizada para logging */
  logMessage?: string;
  /** Mensagem de erro para o cliente (usa ERROR_MESSAGES se não fornecido) */
  clientMessage?: string;
  /** Operação sendo executada (para contexto no log) */
  operation?: string;
  /** Se deve re-lançar exceções HTTP específicas (padrão: true) */
  rethrowHttpExceptions?: boolean;
}

/**
 * Trata erros em serviços de forma padronizada
 *
 * Este helper padroniza o tratamento de erros em serviços, garantindo:
 * - Exceções HTTP específicas (BadRequestException, NotFoundException, etc.) são re-lançadas
 * - Erros genéricos são logados e convertidos em BadRequestException
 * - Mensagens de erro consistentes usando ERROR_MESSAGES
 * - Logging estruturado com contexto
 *
 * @param error - Erro capturado
 * @param logger - Logger do serviço
 * @param defaultMessage - Mensagem padrão de erro (usa ERROR_MESSAGES se não fornecido)
 * @param options - Opções adicionais para tratamento de erro
 * @throws HttpException - Sempre lança uma exceção HTTP apropriada
 *
 * @example
 * ```typescript
 * // Uso básico
 * try {
 *   await this.db.getPrisma().veiculo.create({ data });
 * } catch (error) {
 *   handleServiceError(error, this.logger, ERROR_MESSAGES.CREATE_FAILED);
 * }
 *
 * // Com contexto adicional
 * try {
 *   await this.db.getPrisma().equipe.update({ where: { id }, data });
 * } catch (error) {
 *   handleServiceError(error, this.logger, ERROR_MESSAGES.UPDATE_FAILED, {
 *     operation: 'update',
 *     logMessage: `Erro ao atualizar equipe ${id}`
 *   });
 * }
 * ```
 */
export function handleServiceError(
  error: unknown,
  logger: Logger,
  defaultMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR,
  options: HandleServiceErrorOptions = {}
): never {
  const {
    logMessage,
    clientMessage,
    operation,
    rethrowHttpExceptions = true,
  } = options;

  // Re-lançar exceções HTTP específicas se configurado
  if (rethrowHttpExceptions) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    if (error instanceof ConflictException) {
      throw error;
    }
    if (error instanceof ForbiddenException) {
      throw error;
    }
    if (error instanceof BadRequestException) {
      throw error;
    }
    if (error instanceof HttpException) {
      throw error;
    }
  }

  // Logar erro com contexto
  const errorMessage = logMessage || defaultMessage;
  const operationContext = operation ? ` [${operation}]` : '';
  const errorDetails =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { error: String(error) };

  logger.error(`${errorMessage}${operationContext}`, errorDetails);

  // Lançar exceção apropriada para o cliente
  const clientErrorMessage = clientMessage || defaultMessage;
  throw new BadRequestException(clientErrorMessage);
}

/**
 * Trata erros específicos de operações CRUD
 *
 * Wrapper especializado para operações CRUD comuns que fornece
 * mensagens de erro apropriadas baseadas na operação.
 *
 * @param error - Erro capturado
 * @param logger - Logger do serviço
 * @param operation - Tipo de operação ('create' | 'update' | 'delete' | 'find' | 'list' | 'sync')
 * @param entityName - Nome da entidade (ex: 'veículo', 'equipe')
 * @param options - Opções adicionais
 * @throws HttpException - Sempre lança uma exceção HTTP apropriada
 *
 * @example
 * ```typescript
 * try {
 *   await this.db.getPrisma().veiculo.create({ data });
 * } catch (error) {
 *   handleCrudError(error, this.logger, 'create', 'veículo');
 * }
 * ```
 */
export function handleCrudError(
  error: unknown,
  logger: Logger,
  operation: 'create' | 'update' | 'delete' | 'find' | 'list' | 'sync' | 'count',
  entityName: string,
  options: Omit<HandleServiceErrorOptions, 'operation' | 'clientMessage'> = {}
): never {
  const operationMessages: Record<
    typeof operation,
    { log: string; client: string }
  > = {
    create: {
      log: `Erro ao criar ${entityName}`,
      client: ERROR_MESSAGES.CREATE_FAILED,
    },
    update: {
      log: `Erro ao atualizar ${entityName}`,
      client: ERROR_MESSAGES.UPDATE_FAILED,
    },
    delete: {
      log: `Erro ao remover ${entityName}`,
      client: ERROR_MESSAGES.DELETE_FAILED,
    },
    find: {
      log: `Erro ao buscar ${entityName}`,
      client: ERROR_MESSAGES.ELETRICISTA_NOT_FOUND, // Mensagem genérica - será substituída pela específica quando aplicável
    },
    list: {
      log: `Erro ao listar ${entityName}`,
      client: ERROR_MESSAGES.LIST_FAILED,
    },
    sync: {
      log: `Erro ao sincronizar ${entityName}`,
      client: ERROR_MESSAGES.SYNC_FAILED,
    },
    count: {
      log: `Erro ao contar ${entityName}`,
      client: ERROR_MESSAGES.COUNT_FAILED,
    },
  };

  const messages = operationMessages[operation];

  return handleServiceError(error, logger, messages.client, {
    ...options,
    operation,
    logMessage: messages.log,
    clientMessage: messages.client,
  });
}

