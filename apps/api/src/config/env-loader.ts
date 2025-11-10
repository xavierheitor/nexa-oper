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
 * Em produção, tenta múltiplos caminhos para garantir que encontre o arquivo.
 */
export function loadEnvironmentVariables(): void {
  // Lista de caminhos possíveis para o .env (em ordem de prioridade)
  const possiblePaths = [
    // Caminho especificado via variável de ambiente
    process.env.ENV_FILE_PATH,
    // Caminho relativo ao diretório atual (funciona em dev)
    __dirname.includes('dist')
      ? resolve(__dirname.replace('/dist', ''), '.env')
      : resolve(__dirname.replace('/src', ''), '.env'),
    // Caminho absoluto comum em produção
    '/var/www/nexa-oper/apps/api/.env',
    // Caminho relativo à raiz do projeto
    resolve(process.cwd(), 'apps/api/.env'),
    // Caminho relativo ao diretório de execução
    resolve(process.cwd(), '.env'),
  ].filter(Boolean); // Remove valores undefined/null

  // Tentar carregar de cada caminho até encontrar um arquivo válido
  for (const envPath of possiblePaths) {
    try {
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        // Arquivo encontrado e carregado com sucesso
        return;
      }
    } catch (error) {
      // Continuar tentando outros caminhos
      continue;
    }
  }

  // Se nenhum arquivo foi encontrado, tentar carregar do padrão (process.cwd())
  dotenv.config();
}

