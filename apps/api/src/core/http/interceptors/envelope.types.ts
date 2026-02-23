/**
 * Envelope padrão de todas as respostas da API (Opção A).
 * Sempre: { success: true, data: T }; opcionalmente message e meta (ex.: listas paginadas).
 */
export interface ApiEnvelope<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/** Chaves internas usadas pelo helper (não enviadas ao cliente). */
export const ENVELOPE_DATA = Symbol.for('nexa.envelope.data');
export const ENVELOPE_META = Symbol.for('nexa.envelope.meta');

export interface EnvelopeMeta {
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Objeto retornado pelo helper envelopeData(); o interceptor converte em ApiEnvelope.
 */
export interface EnvelopePayload<T> {
  [ENVELOPE_DATA]: T;
  [ENVELOPE_META]: EnvelopeMeta;
}

/**
 * Retorna um objeto que o ResponseEnvelopeInterceptor reconhece e converte em
 * { success: true, data, message?, meta? }. Use em controllers quando quiser
 * incluir message ou meta além do data.
 */
export function envelopeData<T>(
  data: T,
  options?: { message?: string; meta?: Record<string, unknown> },
): EnvelopePayload<T> {
  return {
    [ENVELOPE_DATA]: data,
    [ENVELOPE_META]: options ?? {},
  } as EnvelopePayload<T>;
}

/**
 * Monta o objeto de envelope para envio direto (ex.: quando o controller usa @Res()
 * e chama res.json()). Use em respostas que bypassam o interceptor.
 */
export function envelope<T>(
  data: T,
  options?: { message?: string; meta?: Record<string, unknown> },
): ApiEnvelope<T> {
  return {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
  };
}

export function isEnvelopePayload(
  value: unknown,
): value is EnvelopePayload<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    ENVELOPE_DATA in value &&
    ENVELOPE_META in value
  );
}
