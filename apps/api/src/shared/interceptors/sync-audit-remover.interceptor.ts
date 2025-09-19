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
    this.logger.debug('=== INÍCIO SyncAuditRemoverInterceptor ===');
    this.logger.debug(`Timestamp: ${new Date().toISOString()}`);

    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Request URL: ${request.url}`);
    this.logger.debug(`Request method: ${request.method}`);
    this.logger.debug(`Request headers: ${JSON.stringify(request.headers)}`);

    const isSyncRoute = request.url?.includes('/sync');
    this.logger.debug(`É endpoint de sync: ${isSyncRoute}`);

    if (!isSyncRoute) {
      this.logger.debug('Não é endpoint de sync, passando sem interceptar');
      return next.handle();
    }

    this.logger.debug(`Interceptando endpoint de sync: ${request.url}`);

    return next.handle().pipe(
      map(data => {
        this.logger.debug('=== PROCESSANDO RESPOSTA ===');
        this.logger.debug(`Dados recebidos: ${JSON.stringify(data)}`);
        this.logger.debug(`Tipo dos dados: ${typeof data}`);
        this.logger.debug(`É array: ${Array.isArray(data)}`);
        this.logger.debug(
          `É objeto: ${typeof data === 'object' && data !== null}`
        );

        const processedData = this.removeAuditFields(data);

        this.logger.debug(
          `Dados processados: ${JSON.stringify(processedData)}`
        );
        this.logger.debug('=== FIM SyncAuditRemoverInterceptor ===');

        return processedData;
      })
    );
  }

  /**
   * Remove campos de auditoria de dados recursivamente
   */
  private removeAuditFields(data: any): any {
    this.logger.debug('=== INÍCIO removeAuditFields ===');
    this.logger.debug(`Dados recebidos: ${JSON.stringify(data)}`);
    this.logger.debug(`Tipo dos dados: ${typeof data}`);
    this.logger.debug(`É null: ${data === null}`);
    this.logger.debug(`É undefined: ${data === undefined}`);

    if (!data) {
      this.logger.debug('Dados são falsy, retornando como estão');
      return data;
    }

    // Se for array, processa cada item
    if (Array.isArray(data)) {
      this.logger.debug(`Processando array com ${data.length} itens`);
      const processed = data.map((item, index) => {
        this.logger.debug(
          `Processando item ${index + 1} do array: ${JSON.stringify(item)}`
        );
        const result = this.removeAuditFields(item);
        this.logger.debug(
          `Item ${index + 1} processado: ${JSON.stringify(result)}`
        );
        return result;
      });
      this.logger.debug(`Array processado: ${JSON.stringify(processed)}`);
      return processed;
    }

    // Se for objeto, remove campos de auditoria
    if (typeof data === 'object' && data !== null) {
      this.logger.debug('Processando objeto');
      this.logger.debug(`Campos originais: ${Object.keys(data).join(', ')}`);

      const cleanedData = { ...data };

      // Remove campos de auditoria
      this.logger.debug(
        `Campos de auditoria a remover: ${this.AUDIT_FIELDS.join(', ')}`
      );
      this.AUDIT_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(cleanedData, field)) {
          this.logger.debug(
            `Removendo campo de auditoria: ${field} = ${cleanedData[field]}`
          );
          delete cleanedData[field];
        }
      });

      this.logger.debug(
        `Campos após remoção: ${Object.keys(cleanedData).join(', ')}`
      );

      // Processa propriedades aninhadas recursivamente
      Object.keys(cleanedData).forEach(key => {
        if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
          this.logger.debug(`Processando campo aninhado: ${key}`);
          const originalValue = cleanedData[key];
          cleanedData[key] = this.removeAuditFields(originalValue);
          this.logger.debug(
            `Campo ${key} processado: ${JSON.stringify(cleanedData[key])}`
          );
        }
      });

      this.logger.debug(`Objeto final: ${JSON.stringify(cleanedData)}`);
      this.logger.debug('=== FIM removeAuditFields ===');
      return cleanedData;
    }

    // Para primitivos, retorna como está
    this.logger.debug('Dados são primitivos, retornando como estão');
    this.logger.debug('=== FIM removeAuditFields ===');
    return data;
  }
}
