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
    this.logger.verbose('=== INÍCIO SyncAuditRemoverInterceptor ===');
    this.logger.verbose(`Timestamp: ${new Date().toISOString()}`);

    const request = context.switchToHttp().getRequest();
    this.logger.verbose(`Request URL: ${request.url}`);
    this.logger.verbose(`Request method: ${request.method}`);
    this.logger.verbose(`Request headers: ${JSON.stringify(request.headers)}`);

    const isSyncRoute = request.url?.includes('/sync');
    this.logger.verbose(`É endpoint de sync: ${isSyncRoute}`);

    if (!isSyncRoute) {
      this.logger.verbose('Não é endpoint de sync, passando sem interceptar');
      return next.handle();
    }

    this.logger.verbose(`Interceptando endpoint de sync: ${request.url}`);

    return next.handle().pipe(
      map(data => {
        this.logger.verbose('=== PROCESSANDO RESPOSTA ===');
        this.logger.verbose(`Dados recebidos: ${JSON.stringify(data)}`);
        this.logger.verbose(`Tipo dos dados: ${typeof data}`);
        this.logger.verbose(`É array: ${Array.isArray(data)}`);
        this.logger.verbose(
          `É objeto: ${typeof data === 'object' && data !== null}`
        );

        const processedData = this.removeAuditFields(data);

        this.logger.verbose(
          `Dados processados: ${JSON.stringify(processedData)}`
        );
        this.logger.verbose('=== FIM SyncAuditRemoverInterceptor ===');

        return processedData;
      })
    );
  }

  /**
   * Remove campos de auditoria de dados recursivamente
   */
  private removeAuditFields(data: any): any {
    this.logger.verbose('=== INÍCIO removeAuditFields ===');
    this.logger.verbose(`Dados recebidos: ${JSON.stringify(data)}`);
    this.logger.verbose(`Tipo dos dados: ${typeof data}`);
    this.logger.verbose(`É null: ${data === null}`);
    this.logger.verbose(`É undefined: ${data === undefined}`);

    if (!data) {
      this.logger.verbose('Dados são falsy, retornando como estão');
      return data;
    }

    // Se for array, processa cada item
    if (Array.isArray(data)) {
      this.logger.verbose(`Processando array com ${data.length} itens`);
      const processed = data.map((item, index) => {
        this.logger.verbose(
          `Processando item ${index + 1} do array: ${JSON.stringify(item)}`
        );
        const result = this.removeAuditFields(item);
        this.logger.verbose(
          `Item ${index + 1} processado: ${JSON.stringify(result)}`
        );
        return result;
      });
      this.logger.verbose(`Array processado: ${JSON.stringify(processed)}`);
      return processed;
    }

    // Se for objeto, remove campos de auditoria
    if (typeof data === 'object' && data !== null) {
      this.logger.verbose('Processando objeto');
      this.logger.verbose(`Campos originais: ${Object.keys(data).join(', ')}`);

      const cleanedData = { ...data };

      // Remove campos de auditoria
      this.logger.verbose(
        `Campos de auditoria a remover: ${this.AUDIT_FIELDS.join(', ')}`
      );
      this.AUDIT_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(cleanedData, field)) {
          this.logger.verbose(
            `Removendo campo de auditoria: ${field} = ${cleanedData[field]}`
          );
          delete cleanedData[field];
        }
      });

      this.logger.verbose(
        `Campos após remoção: ${Object.keys(cleanedData).join(', ')}`
      );

      // Processa propriedades aninhadas recursivamente
      Object.keys(cleanedData).forEach(key => {
        if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
          this.logger.verbose(`Processando campo aninhado: ${key}`);
          const originalValue = cleanedData[key];
          cleanedData[key] = this.removeAuditFields(originalValue);
          this.logger.verbose(
            `Campo ${key} processado: ${JSON.stringify(cleanedData[key])}`
          );
        }
      });

      this.logger.verbose(`Objeto final: ${JSON.stringify(cleanedData)}`);
      this.logger.verbose('=== FIM removeAuditFields ===');
      return cleanedData;
    }

    // Para primitivos, retorna como está
    this.logger.verbose('Dados são primitivos, retornando como estão');
    this.logger.verbose('=== FIM removeAuditFields ===');
    return data;
  }
}
