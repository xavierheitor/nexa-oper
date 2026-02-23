/**
 * Contrato externo padrão de sucesso da API.
 * Deve permanecer estável entre versões para clientes mobile/web.
 */
export interface ApiEnvelopeContract<TData = unknown> {
  success: true;
  data: TData;
  message?: string;
  meta?: Record<string, unknown>;
}
