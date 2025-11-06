/**
 * Configuração de rotas especiais
 *
 * Define rotas especiais como health checks e outras rotas
 * que não fazem parte dos módulos principais.
 */

import { Express, Request, Response } from 'express';

/**
 * Configura rotas especiais da aplicação
 *
 * @param expressApp - Instância do Express
 */
export function configureSpecialRoutes(expressApp: Express): void {
  // Rota crua para health básico
  expressApp.get('/__ping', (_req: Request, res: Response) =>
    res.status(200).send('ok')
  );
}

