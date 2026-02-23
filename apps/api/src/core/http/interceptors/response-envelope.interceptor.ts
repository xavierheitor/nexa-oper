import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import {
  type ApiEnvelope,
  isEnvelopePayload,
  ENVELOPE_DATA,
  ENVELOPE_META,
  type EnvelopeMeta,
} from './envelope.types';

function isExpressResponse(value: unknown): value is Response {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'json' in value &&
    typeof (value as Response).status === 'function'
  );
}

/**
 * Interceptor global que envolve todas as respostas em { success: true, data }.
 * - Se o controller retornar um payload criado com envelopeData(), expande para
 *   { success: true, data, message?, meta? }.
 * - Se o controller retornar Response (express) ou undefined, não altera.
 * - Caso contrário, envolve em { success: true, data: value }.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiEnvelope<unknown> | undefined | Response> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value === undefined || value === null) {
          return undefined;
        }
        if (isExpressResponse(value)) {
          return value;
        }
        if (isEnvelopePayload(value)) {
          const raw = value as unknown as Record<symbol, unknown>;
          const data = raw[ENVELOPE_DATA];
          const meta = raw[ENVELOPE_META] as EnvelopeMeta;
          const envelope: ApiEnvelope<unknown> = {
            success: true,
            data,
            ...(meta?.message && { message: meta.message }),
            ...(meta?.meta && { meta: meta.meta }),
          };
          return envelope;
        }
        return {
          success: true,
          data: value,
        } as ApiEnvelope<unknown>;
      }),
    );
  }
}
