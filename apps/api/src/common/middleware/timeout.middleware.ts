/**
 * Middleware para timeout de requisições
 *
 * Define timeout padrão para requisições HTTP para evitar
 * que requisições travadas fiquem esperando indefinidamente.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que configura timeout para requisições
 *
 * Define timeout de 60 segundos (1 minuto) para requisições e respostas.
 *
 * @param req - Objeto Request do Express
 * @param res - Objeto Response do Express
 * @param next - Função Next do Express
 */
export function timeoutMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timeoutMs = 60_000; // 1 minuto
  req.setTimeout(timeoutMs);
  res.setTimeout(timeoutMs);
  next();
}
