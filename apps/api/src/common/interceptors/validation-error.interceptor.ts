/**
 * Interceptor para padronização de erros de validação
 *
 * Este interceptor captura erros de validação do class-validator
 * e os converte para o formato padronizado esperado pelo app mobile.
 */

import {
  handleValidationError,
  createStandardErrorResponse,
} from '@common/utils/error-response';
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

@Injectable()
export class ValidationErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        const request = context.switchToHttp().getRequest();
        const path = request.url;

        // Se é um erro de validação do class-validator
        if (
          error.status === HttpStatus.BAD_REQUEST &&
          error.response?.message
        ) {
          const validationError = handleValidationError(error, path);
          return throwError(() => validationError);
        }

        // Se é um erro de validação com formato específico
        if (error.message && Array.isArray(error.message)) {
          const validationError = handleValidationError(error, path);
          return throwError(() => validationError);
        }

        // Se é um HttpException, manter como está
        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        // Para outros erros, usar resposta padronizada
        const standardError = createStandardErrorResponse(
          error.message || 'Erro interno do servidor',
          path,
          error.status || HttpStatus.INTERNAL_SERVER_ERROR
        );

        return throwError(() => standardError);
      })
    );
  }
}
