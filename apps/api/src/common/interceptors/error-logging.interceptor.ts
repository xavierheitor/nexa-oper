/**
 * Interceptor para Logging Estruturado de Erros
 *
 * Este interceptor captura erros não tratados e os registra de forma
 * estruturada com contexto completo para facilitar debugging e monitoramento.
 *
 * CARACTERÍSTICAS:
 * - Captura erros de forma centralizada
 * - Logging estruturado com contexto
 * - Sanitização automática de dados sensíveis
 * - Rastreamento de requisições
 * - Compatível com diferentes tipos de erro
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { logErrorStructured, LogContext, StandardLogger } from '../utils/logger';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new StandardLogger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Criar contexto de logging
    const logContext: LogContext = {
      requestId: this.generateRequestId(),
      operation: `${request.method} ${request.url}`,
      module: context.getClass().name,
      metadata: {
        userAgent: request.headers['user-agent'],
        ip: request.ip || request.connection.remoteAddress,
        url: request.url,
        method: request.method,
      },
    };

    return next.handle().pipe(
      catchError((error) => {
        // Enriquecer contexto com dados do usuário se disponível
        if (request.user) {
          logContext.userId = request.user.id || request.user.sub;
          logContext.metadata = {
            ...logContext.metadata,
            userId: request.user.id || request.user.sub,
            userMatricula: request.user.matricula,
          };
        }

        // Log do erro estruturado
        logErrorStructured(
          this.logger,
          `Erro capturado em ${logContext.operation}`,
          error,
          logContext
        );

        // Re-lançar o erro para não quebrar o fluxo
        return throwError(() => error);
      })
    );
  }

  /**
   * Gera ID único para rastreamento de requisições
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
