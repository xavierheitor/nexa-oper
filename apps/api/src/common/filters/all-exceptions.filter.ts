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
} from '@nestjs/common';
import { StandardLogger, sanitizeData } from '@common/utils/logger';
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
  private readonly logger = new StandardLogger(AllExceptionsFilter.name);
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

    // Extrai e normaliza mensagem segura para o cliente
    let safeMessage: string | string[] = 'Internal server error';
    let responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      const resp = exception.getResponse() as any;

      // Se o response é um objeto, preservar todos os campos
      if (typeof resp === 'object' && resp !== null) {
        // Se tem message, extrair para compatibilidade
        const msg = resp.message;
        safeMessage = Array.isArray(msg) ? msg : msg ?? exception.message;

        // Preservar todos os campos do objeto original (status, closedAt, kmFinal, etc.)
        // mas sobrescrever com campos padrão se necessário
        responseBody = {
          ...resp, // Preserva campos originais (status, closedAt, kmFinal, etc.)
          statusCode: status, // Garante que statusCode está correto
          timestamp: resp.timestamp || responseBody.timestamp, // Usa timestamp do objeto se existir
          path: resp.path || responseBody.path, // Usa path do objeto se existir
          message: safeMessage, // Usa mensagem normalizada
        };
      } else {
        // Se é string, usar formato padrão
        safeMessage = resp ?? exception.message;
        responseBody.message = safeMessage;
      }
    } else if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      safeMessage = exception.message;
      responseBody.message = safeMessage;
    } else {
      responseBody.message = safeMessage;
    }

    // Cria payload estruturado para logging com informações relevantes
    const logPayload = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      message: safeMessage,
      headers: sanitizeData(request.headers),
      body: sanitizeData((request as any).body),
    };

    // Registra log com severidade baseada no status HTTP usando Logger
    if (status >= 500) {
      const errorMessage = exception instanceof Error ? exception.message : 'Internal Server Error';
      const errorStack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`[500] ${request.method} ${request.url} - ${errorMessage}`, errorStack);
    } else if (status >= 400) {
      // Casos especiais que são comportamentos esperados, não erros
      const isExpectedBehavior = 
        status === HttpStatus.CONFLICT && 
        typeof responseBody === 'object' && 
        responseBody.status === 'already_closed';
      
      if (isExpectedBehavior) {
        // Logar como debug - é comportamento esperado para sincronização mobile
        this.logger.debug(
          `[409] Sincronização mobile - turno já fechado: ${responseBody.remoteId || 'N/A'}`
        );
      } else {
        this.logger.warn(`[${status}] ${request.method} ${request.url} - ${JSON.stringify(safeMessage)}`);
      }
    }

    // Envia resposta HTTP padronizada ao cliente (preservando campos adicionais quando for objeto)
    response.status(status).json(responseBody);
  }
}
