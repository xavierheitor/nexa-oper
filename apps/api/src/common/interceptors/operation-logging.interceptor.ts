/**
 * Interceptor para Logging Automático de Operações
 *
 * Este interceptor aplica logging automático em métodos marcados com
 * @LogOperation, fornecendo contexto estruturado e sanitização de dados.
 *
 * CARACTERÍSTICAS:
 * - Aplicação automática baseada em metadata
 * - Logging de entrada e saída
 * - Medição de tempo de execução
 * - Sanitização de dados sensíveis
 * - Contexto estruturado
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LOG_OPERATION_KEY, LogOperationOptions } from '../decorators/log-operation.decorator';
import {
  logOperationWithContext,
  logErrorStructured,
  LogContext,
  StandardLogger
} from '../utils/logger';

@Injectable()
export class OperationLoggingInterceptor implements NestInterceptor {
  private readonly logger = new StandardLogger(OperationLoggingInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logOptions = this.reflector.get<LogOperationOptions>(
      LOG_OPERATION_KEY,
      context.getHandler()
    );

    // Se não há configuração de logging, prosseguir normalmente
    if (!logOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    // Criar contexto base
    const baseContext: LogContext = {
      requestId: this.generateRequestId(),
      operation: logOptions.operation,
      module: className,
      metadata: {
        method: methodName,
        url: request.url,
        httpMethod: request.method,
        ...logOptions.context?.metadata,
      },
    };

    // Enriquecer com dados do usuário se disponível
    if (request.user) {
      baseContext.userId = request.user.id || request.user.sub;
      baseContext.metadata = {
        ...baseContext.metadata,
        userId: request.user.id || request.user.sub,
        userMatricula: request.user.matricula,
      };
    }

    // Log de entrada
    if (logOptions.logInput) {
      const inputData = this.extractInputData(context);
      logOperationWithContext(
        this.logger,
        `Iniciando ${logOptions.operation}`,
        baseContext,
        inputData
      );
    }

    const startTime = logOptions.measureTime ? Date.now() : undefined;

    return next.handle().pipe(
      tap((data) => {
        // Log de saída
        if (logOptions.logOutput) {
          const outputData = this.sanitizeOutputData(data);
          logOperationWithContext(
            this.logger,
            `Concluindo ${logOptions.operation}`,
            baseContext,
            outputData
          );
        }

        // Log de tempo de execução
        if (logOptions.measureTime && startTime) {
          const executionTime = Date.now() - startTime;
          logOperationWithContext(
            this.logger,
            `${logOptions.operation} executado em ${executionTime}ms`,
            baseContext
          );
        }
      }),
      catchError((error) => {
        // Log de erro
        logErrorStructured(
          this.logger,
          `Erro em ${logOptions.operation}`,
          error,
          baseContext
        );

        // Re-lançar o erro
        throw error;
      })
    );
  }

  /**
   * Extrai dados de entrada do contexto
   */
  private extractInputData(context: ExecutionContext): any {
    const args = context.getArgs();

    // Para controladores, pegar body, query e params
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return {
        body: request.body,
        query: request.query,
        params: request.params,
      };
    }

    // Para outros contextos, retornar argumentos
    return args;
  }

  /**
   * Sanitiza dados de saída
   */
  private sanitizeOutputData(data: any): any {
    // Se for uma resposta HTTP, sanitizar apenas o body
    if (data && typeof data === 'object' && 'data' in data) {
      return {
        ...data,
        data: this.sanitizeData(data.data),
      };
    }

    return this.sanitizeData(data);
  }

  /**
   * Sanitiza dados removendo informações sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'senha', 'token', 'secret', 'authorization'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '****';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  /**
   * Gera ID único para rastreamento
   */
  private generateRequestId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
