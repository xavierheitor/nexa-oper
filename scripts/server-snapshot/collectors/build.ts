import path from 'node:path';

import {
  formatDateTime,
  getPathStat,
  sectionTitle,
} from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const BUILD_PATHS = [
  'apps/api/dist',
  'apps/web/.next',
] as const;

export async function collectBuild(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(9, 'Build'));

  for (const relativePath of BUILD_PATHS) {
    const absolutePath = path.join(ctx.repoRoot, relativePath);
    const info = await getPathStat(absolutePath);

    if (!info.exists) {
      ctx.lines.push(`${relativePath}: ✘ não existe`);
      ctx.problems.push(`Build ausente: ${relativePath}`);
      continue;
    }

    ctx.lines.push(
      `${relativePath}: ✔ existe | modificado: ${
        info.mtime ? formatDateTime(info.mtime) : 'n/d'
      }${info.size ? ` | tamanho: ${info.size}` : ''}`,
    );
  }

  ctx.lines.push('');
}
