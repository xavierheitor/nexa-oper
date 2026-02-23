/**
 * Contrato externo padrão de erro da API.
 * Mantém consistência com o GlobalExceptionFilter.
 */
export interface ApiErrorContract {
  statusCode: number;
  code: string;
  message: string;
  details?: string[];
  timestamp: string;
  path: string;
  requestId?: string;
}
