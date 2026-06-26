import path from 'node:path';

import { formatEnvFile, parseEnvContent } from '../utils/env-parse';
import { safeReadFile, sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const ENV_CANDIDATES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
  'apps/api/.env',
  'apps/web/.env',
  'apps/web/.env.local',
  'packages/db/.env',
] as const;

export async function collectEnvFiles(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(7, 'Arquivos .env'));

  let foundAny = false;

  for (const relativePath of ENV_CANDIDATES) {
    const absolutePath = path.join(ctx.repoRoot, relativePath);
    const content = await safeReadFile(absolutePath);

    if (content === null) {
      ctx.lines.push(`Arquivo: ${absolutePath}`);
      ctx.lines.push('(não encontrado)');
      ctx.lines.push('');
      continue;
    }

    foundAny = true;
    ctx.lines.push(...formatEnvFile(absolutePath, content));

    const parsed = parseEnvContent(content);
    for (const [key, value] of Object.entries(parsed)) {
      ctx.envValues.set(key, value);
    }
  }

  if (!foundAny) {
    ctx.problems.push('Nenhum arquivo .env encontrado nos caminhos esperados');
  }

  const importantKeys = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'CORS_ORIGINS',
    'UPLOAD_ROOT',
    'NEXT_PUBLIC_API_URL',
  ];

  for (const key of importantKeys) {
    if (!ctx.envValues.has(key)) {
      ctx.problems.push(`Variável importante ausente nos .env coletados: ${key}`);
    }
  }
}
