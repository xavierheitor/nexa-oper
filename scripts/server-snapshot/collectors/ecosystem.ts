import path from 'node:path';

import { safeReadFile, sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const ECOSYSTEM_CANDIDATES = [
  'ecosystem.config.cjs',
  'ecosystem.config.js',
  'ecosystem.config.ts',
] as const;

export async function collectEcosystem(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(6, 'ecosystem.config'));

  let found: string | null = null;

  for (const name of ECOSYSTEM_CANDIDATES) {
    const candidate = path.join(ctx.repoRoot, name);
    const content = await safeReadFile(candidate);
    if (content !== null) {
      found = candidate;
      ctx.lines.push(`Arquivo: ${candidate}`);
      ctx.lines.push('');
      ctx.lines.push(content);
      ctx.lines.push('');
      break;
    }
  }

  if (!found) {
    ctx.problems.push('ecosystem.config não encontrado na raiz do repositório');
    ctx.lines.push('(nenhum ecosystem.config.{js,cjs,ts} encontrado)');
    ctx.lines.push('');
  }
}
