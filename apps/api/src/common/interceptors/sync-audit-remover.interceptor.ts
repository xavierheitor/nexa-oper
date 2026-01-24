/**
 * Interceptor para Remover Campos de Auditoria em Sincronização
 *
 * Este interceptor automaticamente remove campos de auditoria
 * de respostas de endpoints de sincronização, reduzindo o payload
 * e mantendo apenas dados essenciais para o cliente mobile.
 *
 * CAMPOS REMOVIDOS:
 * - createdAt, updatedAt, deletedAt
 * - createdBy, updatedBy, deletedBy
 *
 * APLICAÇÃO:
 * - Apenas em rotas que contêm '/sync' no path
 * - Funciona com arrays e objetos únicos
 * - Preserva estrutura de dados aninhados
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor para remover campos de auditoria em sincronização
 */
@Injectable()
export class SyncAuditRemoverInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SyncAuditRemoverInterceptor.name);

  /**
   * Campos de auditoria que serão removidos
   */
  private readonly AUDIT_FIELDS = [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'createdBy',
    'updatedBy',
    'deletedBy',
  ] as const;

  /**
   * Intercepta a resposta e remove campos de auditoria se for rota de sync
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isSyncRoute = request.url?.includes('/sync');

    if (!isSyncRoute) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        const shape = Array.isArray(data)
          ? `array com ${data.length} itens`
          : typeof data === 'object' && data !== null
            ? 'objeto'
            : 'primitivo';
        this.logger.verbose(`${request.method} ${request.url} - ${shape}`);

        return this.removeAuditFields(data);
      })
    );
  }

  /**
   * Remove campos de auditoria de dados recursivamente
   */
  private removeAuditFields(data: any): any {
    if (!data) {
      return data;
    }

    // Se for array, processa cada item
    if (Array.isArray(data)) {
      return data.map(item => this.removeAuditFields(item));
    }

    // Se for objeto, remove campos de auditoria
    if (typeof data === 'object' && data !== null) {
      const cleanedData = { ...data };

      this.AUDIT_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(cleanedData, field)) {
          delete cleanedData[field];
        }
      });

      // Processa propriedades aninhadas recursivamente
      Object.keys(cleanedData).forEach(key => {
        if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
          cleanedData[key] = this.removeAuditFields(cleanedData[key]);
        }
      });

      return cleanedData;
    }

    return data;
  }
}
