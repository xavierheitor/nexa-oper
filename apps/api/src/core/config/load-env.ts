import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { findWorkspaceRoot } from './workspace-paths';

function loadIfExists(envPath: string): void {
  if (!existsSync(envPath)) return;
  dotenvConfig({ path: envPath });
}

function loadEnvChain(): void {
  const appRoot = path.resolve(__dirname, '../../..');
  const workspaceRoot = findWorkspaceRoot(appRoot);

  // Prioridade (maior -> menor): app .env.local > app .env > root .env.local > root .env
  const files = [path.join(appRoot, '.env.local'), path.join(appRoot, '.env')];

  if (workspaceRoot !== appRoot) {
    files.push(path.join(workspaceRoot, '.env.local'));
    files.push(path.join(workspaceRoot, '.env'));
  }

  for (const file of files) {
    loadIfExists(file);
  }
}

loadEnvChain();
