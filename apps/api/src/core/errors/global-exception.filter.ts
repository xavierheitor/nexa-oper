// src/core/errors/global-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppError } from './app-error';
import { AppLogger } from '../logger/app-logger';
import { Messages } from './messages';
function getHeaderString(req: Request, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function mapStatusToCode(status: number) {
  switch (status) {
    case 400:
      return 'VALIDATION';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL' : 'VALIDATION';
  }
}

type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: string[];
  timestamp: string;
  path: string;
  requestId?: string;
};

@Catch()
/**
 * Filtro global de exceções para a aplicação.
 *
 * Captura todas as exceções não tratadas e formata a resposta HTTP de acordo com o padrão `ApiErrorBody`.
 * Lida com três tipos principais de erro:
 * 1. `AppError`: Erros de negócio conhecidos e lançados intencionalmente.
 * 2. `HttpException`: Erros do NestJS (ex: 404 Not Found, 400 Bad Request de validação).
 * 3. Erros genéricos (`unknown`): Convertidos para 500 Internal Server Error.
 *
 * Também realiza o log da exceção usando o `AppLogger`, com nível 'error' para 5xx e 'warn' para 4xx.
 */
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly log: AppLogger) {}

  /**
   * Método chamado pelo NestJS quando uma exceção é lançada.
   *
   * @param exception - A exceção capturada (pode ser qualquer coisa).
   * @param host - O contexto de argumentos do NestJS (HTTP).
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, body, logLevel, errForLog } = normalizeException(
      exception,
      req,
    );

    if (logLevel === 'error') this.log.error('Request failed', errForLog, body);
    else this.log.warn('Request failed', body);

    res.status(status).json(body);
  }
}

function normalizeException(
  exception: unknown,
  req: Request,
): {
  status: number;
  body: ApiErrorBody;
  logLevel: 'warn' | 'error';
  errForLog: unknown;
} {
  const base = {
    timestamp: new Date().toISOString(),
    path: req.url,
    requestId: getHeaderString(req, 'x-request-id'),
  };

  // 1) AppError
  if (exception instanceof AppError) {
    const body: ApiErrorBody = {
      ...base,
      statusCode: exception.status,
      code: exception.code,
      message: exception.message,
      details: exception.details,
    };
    const logLevel = exception.status >= 500 ? 'error' : 'warn';
    return { status: exception.status, body, logLevel, errForLog: exception };
  }

  // 2) HttpException (Nest)
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const resp = exception.getResponse();

    type NestResponse = string | { message?: string | string[] };
    const respObj = resp as NestResponse;

    const respMessage =
      typeof respObj === 'object' && respObj !== null && 'message' in respObj
        ? respObj.message
        : undefined;

    const message =
      typeof respObj === 'string'
        ? respObj
        : (respMessage ?? exception.message);

    const details = Array.isArray(respMessage) ? respMessage : undefined;

    const body: ApiErrorBody = {
      ...base,
      statusCode: status,
      code: mapStatusToCode(status),
      message: Array.isArray(message)
        ? Messages.invalidPayload
        : String(message),
      details,
    };

    const logLevel = status >= 500 ? 'error' : 'warn';
    return { status, body, logLevel, errForLog: exception };
  }

  // 3) Genérico
  const status = HttpStatus.INTERNAL_SERVER_ERROR;
  const body: ApiErrorBody = {
    ...base,
    statusCode: status,
    code: 'INTERNAL',
    message: Messages.internalServerError,
  };

  return { status, body, logLevel: 'error', errForLog: exception };
}
