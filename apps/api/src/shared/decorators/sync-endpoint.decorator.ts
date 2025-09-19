/**
 * Decorator para Endpoints de Sincronização
 *
 * Este decorator aplica automaticamente o interceptor
 * que remove campos de auditoria de respostas de sincronização.
 */

import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SyncAuditRemoverInterceptor } from '../interceptors/sync-audit-remover.interceptor';

/**
 * Decorator para endpoints de sincronização
 *
 * Aplica automaticamente:
 * - Interceptor para remover campos de auditoria
 * - Tag Swagger para documentação
 *
 * @param tag - Tag do Swagger para agrupamento
 *
 * @example
 * ```typescript
 * @SyncEndpoint('apr-sync')
 * @Get('modelos')
 * findAll() {
 *   return this.service.findAll();
 * }
 * ```
 */
export function SyncEndpoint(tag: string) {
  return applyDecorators(
    UseInterceptors(SyncAuditRemoverInterceptor),
    ApiTags(tag)
  );
}
