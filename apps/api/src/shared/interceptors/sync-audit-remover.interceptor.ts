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
      // Se não for rota de sync, retorna resposta original
      return next.handle();
    }

    this.logger.debug(`Removendo campos de auditoria de: ${request.url}`);

    return next.handle().pipe(
      map((data) => this.removeAuditFields(data))
    );
  }

  /**
   * Remove campos de auditoria de dados recursivamente
   */
  private removeAuditFields(data: any): any {
    if (!data) return data;

    // Se for array, processa cada item
    if (Array.isArray(data)) {
      return data.map(item => this.removeAuditFields(item));
    }

    // Se for objeto, remove campos de auditoria
    if (typeof data === 'object' && data !== null) {
      const cleanedData = { ...data };

      // Remove campos de auditoria
      this.AUDIT_FIELDS.forEach(field => {
        delete cleanedData[field];
      });

      // Processa propriedades aninhadas recursivamente
      Object.keys(cleanedData).forEach(key => {
        if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
          cleanedData[key] = this.removeAuditFields(cleanedData[key]);
        }
      });

      return cleanedData;
    }

    // Para primitivos, retorna como está
    return data;
  }
}
