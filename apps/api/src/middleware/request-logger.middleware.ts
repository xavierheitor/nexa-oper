/**
 * Middleware para logging de requisições HTTP
 *
 * Registra todas as requisições e respostas com método, URL, status code
 * e tempo de processamento.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que registra requisições e respostas
 *
 * Formato de log:
 * - Requisição: [REQ] METHOD /path
 * - Resposta: [RES] METHOD /path -> STATUS_CODE (TIMEms)
 *
 * @param req - Objeto Request do Express
 * @param res - Objeto Response do Express
 * @param next - Função Next do Express
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const t0 = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);

  res.on('finish', () => {
    console.log(
      `[RES] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - t0}ms)`
    );
  });

  next();
}
