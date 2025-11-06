/**
 * Utilitário para carregar variáveis de ambiente
 *
 * Carrega o arquivo .env do diretório raiz do projeto API.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

/**
 * Carrega o arquivo .env do diretório raiz do projeto API
 *
 * Detecta automaticamente se está rodando em modo compilado (dist) ou desenvolvimento (src).
 */
export function loadEnvironmentVariables(): void {
  const envPath = resolve(
    __dirname.includes('dist')
      ? __dirname.replace('/dist', '')
      : __dirname.replace('/src', ''),
    '.env'
  );
  dotenv.config({ path: envPath });
}

