/**
 * Filtro Global de Tratamento de Exceções
 *
 * Este filtro intercepta todas as exceções não tratadas que ocorrem na aplicação,
 * fornecendo um tratamento padronizado e logging estruturado para diferentes
 * tipos de erros, garantindo respostas consistentes para o cliente.
 *
 * FUNCIONALIDADES:
 * - Intercepta todas as exceções (HttpException e erros genéricos)
 * - Padroniza formato de resposta de erro para o cliente
 * - Logging diferenciado por severidade (error vs warning)
 * - Extração automática de status HTTP apropriado
 * - Preservação de detalhes de erro para debugging
 * - Emojis para identificação visual rápida nos logs
 *
 * TIPOS DE ERRO TRATADOS:
 * - HttpException (400-499): Erros de cliente (⚠️ warnings)
 * - Erros genéricos (500+): Erros de servidor (🔥 errors)
 * - Validação, autenticação, autorização, etc.
 *
 * ESTRUTURA DE RESPOSTA PADRONIZADA:
 * ```json
 * {
 *   "statusCode": 400,
 *   "timestamp": "2023-01-01T10:00:00.000Z",
 *   "path": "/api/users",
 *   "message": { "error": "Validation failed" }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Configuração no main.ts
 * app.useGlobalFilters(new AllExceptionsFilter());
 *
 * // Em um controller - erro será interceptado automaticamente
 * @Get('users/:id')
 * async getUser(@Param('id') id: string) {
 *   if (!id) {
 *     throw new BadRequestException('ID é obrigatório');
 *   }
 *   // Se ocorrer erro não tratado, será capturado pelo filtro
 * }
 * ```
 *
 * @see {@link https://docs.nestjs.com/exception-filters} - Documentação oficial sobre Exception Filters
 * @author Nexa Oper Team
 * @since 1.0.0
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global para tratamento padronizado de todas as exceções da aplicação.
 *
 * Implementa a interface ExceptionFilter do NestJS para interceptar
 * automaticamente todas as exceções não tratadas, fornecendo logging
 * estruturado e respostas HTTP consistentes.
 *
 * O decorador @Catch() sem parâmetros indica que este filtro captura
 * TODAS as exceções, independentemente do tipo.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  /**
   * Método principal que processa todas as exceções interceptadas.
   *
   * Este método é chamado automaticamente pelo NestJS sempre que uma
   * exceção não tratada ocorre em qualquer parte da aplicação. Ele
   * determina o tipo de erro, extrai informações relevantes, registra
   * logs apropriados e envia uma resposta padronizada ao cliente.
   *
   * FLUXO DE PROCESSAMENTO:
   * 1. Extrai contexto HTTP (request/response) da exceção
   * 2. Determina status HTTP baseado no tipo de exceção
   * 3. Extrai mensagem de erro apropriada
   * 4. Cria payload de log estruturado
   * 5. Registra log com severidade adequada (error/warn)
   * 6. Envia resposta HTTP padronizada ao cliente
   *
   * @param exception - A exceção interceptada (HttpException ou erro genérico)
   * @param host - Contexto de execução fornecido pelo NestJS
   *
   * @example
   * ```typescript
   * // Exceção HTTP será tratada assim:
   * throw new BadRequestException('Dados inválidos');
   * // Log: ⚠️ Client Error: { method: 'POST', url: '/users', status: 400, ... }
   * // Response: { statusCode: 400, timestamp: '...', path: '/users', message: {...} }
   *
   * // Erro genérico será tratado assim:
   * throw new Error('Falha na conexão com banco');
   * // Log: 🔥 Server Error: { method: 'GET', url: '/data', status: 500, ... }
   * // Response: { statusCode: 500, timestamp: '...', path: '/data', message: {...} }
   * ```
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // Extrai o contexto HTTP da exceção
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Determina o status HTTP baseado no tipo de exceção
    const status =
      exception instanceof HttpException
        ? exception.getStatus() // Para HttpException, usa o status definido
        : HttpStatus.INTERNAL_SERVER_ERROR; // Para outros erros, usa 500

    // Extrai a mensagem de erro apropriada baseada no tipo de exceção
    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse() // Para HttpException, usa a resposta definida
        : {
            message: 'Internal server error', // Para outros erros, mensagem genérica em produção
            ...(process.env.NODE_ENV !== 'production' && {
              error: exception instanceof Error ? exception.message : String(exception),
            }), // Detalhes apenas em desenvolvimento
          };

    // Cria payload estruturado para logging com informações relevantes
    const logPayload = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      message: errorResponse,
    };

    // Registra log com severidade baseada no status HTTP usando Logger
    if (status >= 500) {
      // Erros de servidor (5xx) são registrados como errors críticos
      const errorMessage = exception instanceof Error ? exception.message : 'Internal Server Error';
      const errorStack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `🔥 Server Error [${status}]: ${errorMessage} - ${request.method} ${request.url}`,
        errorStack,
        'AllExceptionsFilter'
      );
    } else if (status >= 400) {
      // Erros de cliente (4xx) são registrados como warnings
      const errorMessage =
        exception instanceof HttpException
          ? JSON.stringify(exception.getResponse())
          : 'Client Error';
      this.logger.warn(
        `⚠️ Client Error [${status}]: ${errorMessage} - ${request.method} ${request.url}`,
        'AllExceptionsFilter'
      );
    }

    // Prepara mensagem de erro para o cliente (sanitizada)
    const clientMessage =
      errorResponse instanceof Object
        ? errorResponse // Se errorResponse é objeto, usa diretamente
        : { message: errorResponse }; // Se é string, encapsula em objeto

    // Envia resposta HTTP padronizada ao cliente
    // Em produção, não expõe stack traces ou detalhes internos
    response.status(status).json({
      statusCode: status, // Código de status HTTP
      timestamp: new Date().toISOString(), // Timestamp da ocorrência do erro
      path: request.url, // URL onde o erro ocorreu
      message: clientMessage,
    });
  }
}
