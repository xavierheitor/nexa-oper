/**
 * Decorator para Rotas Públicas
 *
 * Este decorator marca rotas como públicas, permitindo que sejam acessadas
 * sem autenticação. Guards globais devem verificar este metadata para
 * permitir acesso a rotas públicas como health checks e métricas.
 *
 * USO:
 * - Aplicar em rotas que não requerem autenticação
 * - Guards globais devem verificar com Reflector.getAllAndOverride
 * - Permite que rotas críticas como /health e /metrics respondam rapidamente
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * async health() {
 *   return { status: 'ok' };
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Chave de metadata para identificar rotas públicas
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 *
 * Guards globais devem verificar este metadata usando:
 * ```typescript
 * const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
 *   context.getHandler(),
 *   context.getClass(),
 * ]);
 * ```
 *
 * @returns Decorator que marca a rota como pública
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

