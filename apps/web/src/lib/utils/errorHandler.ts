/**
 * Utilitário Centralizado de Tratamento de Erros
 *
 * Este módulo fornece uma função padronizada para tratamento de erros
 * em toda a aplicação, garantindo consistência no logging e nas mensagens
 * retornadas ao usuário.
 *
 * FUNCIONALIDADES:
 * - Normalização de erros (Error, string, unknown)
 * - Logging estruturado com contexto
 * - Mensagens seguras para produção/desenvolvimento
 * - Formatação de ActionResult para Server Actions
 * - Suporte a diferentes contextos de erro
 *
 * PADRÃO DE USO:
 * ```typescript
 * // Em Server Actions
 * try {
 *   // lógica...
 * } catch (error) {
 *   return errorHandler.handle(error, 'NomeDaEntidade', 'create');
 * }
 *
 * // Em componentes/hooks
 * try {
 *   // lógica...
 * } catch (error) {
 *   errorHandler.log(error, 'ComponenteNome');
 *   message.error('Erro ao processar. Tente novamente.');
 * }
 * ```
 */

import type { ActionResult } from '../types/common';

/**
 * Logger client-safe que funciona tanto no servidor quanto no cliente
 * No servidor, usa o logger completo; no cliente, usa console
 */
const getLogger = () => {
  // No servidor, importa dinamicamente o logger completo
  if (typeof window === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logger } = require('./logger');
      return logger;
    } catch {
      // Se falhar, usa console como fallback
      return {
        error: (message: string, meta?: any) => {
          console.error(`[Server] ${message}`, meta);
        },
      };
    }
  }

  // No cliente, usa apenas console
  return {
    error: (message: string, meta?: any) => {
      console.error(`[Client] ${message}`, meta);
    },
  };
};

/**
 * Interface para opções de tratamento de erro
 */
interface ErrorHandlerOptions {
  /**
   * Contexto onde o erro ocorreu (ex: nome da entidade, componente)
   */
  context?: string;

  /**
   * Tipo de ação que estava sendo executada (create, update, delete, etc.)
   */
  actionType?: string;

  /**
   * Dados adicionais para contexto do log
   */
  metadata?: Record<string, any>;

  /**
   * Se deve expor detalhes do erro em produção (padrão: false)
   */
  exposeDetailsInProduction?: boolean;

  /**
   * Mensagem customizada para o usuário
   */
  userMessage?: string;
}

/**
 * Classe estática para tratamento centralizado de erros
 */
class ErrorHandler {
  /**
   * Normaliza um erro desconhecido para um objeto Error
   *
   * @param error - Erro de qualquer tipo (Error, string, unknown)
   * @returns Objeto Error normalizado
   */
  private static normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return new Error(String((error as any).message));
    }

    return new Error('Erro desconhecido');
  }

  /**
   * Extrai mensagem de erro segura para o usuário
   *
   * @param error - Erro normalizado
   * @param options - Opções de tratamento
   * @returns Mensagem segura para exibição
   */
  private static getSafeMessage(
    error: Error,
    options: ErrorHandlerOptions = {}
  ): string {
    // Se há mensagem customizada, usa ela
    if (options.userMessage) {
      return options.userMessage;
    }

    // Em produção, não expõe detalhes técnicos (exceto se explicitamente permitido)
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !options.exposeDetailsInProduction) {
      return 'Ocorreu um erro. Tente novamente.';
    }

    // Em desenvolvimento ou se permitido, expõe a mensagem do erro
    return error.message || 'Erro desconhecido';
  }

  /**
   * Envia log de erro para a API (se configurado)
   *
   * @param message - Mensagem do erro
   * @param options - Opções de tratamento
   * @param metadata - Metadados adicionais
   */
  private static async sendLogToApi(
    message: string,
    options: ErrorHandlerOptions = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    // Só funciona no cliente (browser)
    if (typeof window === 'undefined') {
      return;
    }

    // Verifica se a URL da API está configurada
    const apiLogUrl = process.env.NEXT_PUBLIC_API_LOG_URL;
    if (!apiLogUrl) {
      return;
    }

    try {
      // Envia log para API de forma assíncrona (não bloqueia)
      // Usa fetch nativo do browser (disponível globalmente)
      fetch(`${apiLogUrl}/api/web-logs/error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: options.context,
          actionType: options.actionType,
          metadata,
        }),
        // Não aguarda resposta - fire and forget
        // keepalive garante que a requisição continue mesmo se a página for fechada
        keepalive: true,
      }).catch(() => {
        // Ignora erros de rede silenciosamente
        // Não queremos que falhas no envio de logs quebrem a aplicação
      });
    } catch {
      // Ignora erros silenciosamente
      // Falhas no envio de logs não devem afetar a aplicação
    }
  }

  /**
   * Registra o erro no sistema de logging com contexto completo
   *
   * @param error - Erro a ser logado
   * @param options - Opções de tratamento
   */
  private static logError(error: unknown, options: ErrorHandlerOptions = {}): void {
    const normalizedError = this.normalizeError(error);

    // Monta contexto completo para o log
    const logContext: Record<string, any> = {
      error: normalizedError.message,
      errorName: normalizedError.name,
      errorStack: normalizedError.stack,
      ...options.metadata,
    };

    if (options.context) {
      logContext.context = options.context;
    }

    if (options.actionType) {
      logContext.actionType = options.actionType;
    }

    // Log estruturado usando logger client-safe
    const logger = getLogger();
    const logMessage = `[ErrorHandler] ${options.context || 'Erro'}${options.actionType ? ` - ${options.actionType}` : ''}`;
    logger.error(logMessage, logContext);

    // Envia para API se configurado (fire and forget)
    this.sendLogToApi(logMessage, options, logContext);
  }

  /**
   * Trata um erro e retorna um ActionResult formatado
   *
   * Este método é ideal para uso em Server Actions onde precisamos
   * retornar um ActionResult padronizado.
   *
   * @param error - Erro a ser tratado
   * @param context - Contexto onde o erro ocorreu (ex: 'Eletricista', 'Veiculo')
   * @param actionType - Tipo de ação (ex: 'create', 'update', 'delete')
   * @param options - Opções adicionais de tratamento
   * @returns ActionResult com erro formatado
   *
   * @example
   * ```typescript
   * try {
   *   await service.create(data);
   *   return { success: true, data: result };
   * } catch (error) {
   *   return errorHandler.handle(error, 'Eletricista', 'create');
   * }
   * ```
   */
  static handle<T = unknown>(
    error: unknown,
    context?: string,
    actionType?: string,
    options?: Omit<ErrorHandlerOptions, 'context' | 'actionType'>
  ): ActionResult<T> {
    const normalizedError = this.normalizeError(error);
    const handlerOptions: ErrorHandlerOptions = {
      context,
      actionType,
      ...options,
    };

    // Registra o erro
    this.logError(error, handlerOptions);

    // Retorna ActionResult formatado
    return {
      success: false,
      error: this.getSafeMessage(normalizedError, handlerOptions),
    };
  }

  /**
   * Registra um erro sem retornar ActionResult
   *
   * Este método é ideal para uso em componentes React, hooks ou outros
   * contextos onde não precisamos retornar ActionResult.
   *
   * @param error - Erro a ser logado
   * @param context - Contexto onde o erro ocorreu (ex: 'ComponenteNome', 'HookNome')
   * @param options - Opções adicionais de tratamento
   *
   * @example
   * ```typescript
   * try {
   *   await fetchData();
   * } catch (error) {
   *   errorHandler.log(error, 'MeuComponente');
   *   message.error('Erro ao carregar dados');
   * }
   * ```
   */
  static log(
    error: unknown,
    context?: string,
    options?: Omit<ErrorHandlerOptions, 'context'>
  ): void {
    this.logError(error, { context, ...options });
  }

  /**
   * Obtém mensagem de erro formatada para exibição ao usuário
   *
   * Útil quando você quer apenas a mensagem sem fazer log automático.
   *
   * @param error - Erro a ser formatado
   * @param options - Opções de tratamento
   * @returns Mensagem formatada
   *
   * @example
   * ```typescript
   * try {
   *   // lógica...
   * } catch (error) {
   *   const message = errorHandler.getMessage(error, { context: 'Operação' });
   *   toast.error(message);
   * }
   * ```
   */
  static getMessage(
    error: unknown,
    options?: ErrorHandlerOptions
  ): string {
    const normalizedError = this.normalizeError(error);
    return this.getSafeMessage(normalizedError, options);
  }
}

/**
 * Exporta instância singleton do ErrorHandler
 */
export const errorHandler = ErrorHandler;

/**
 * Exporta classe para casos especiais
 */
export { ErrorHandler };

