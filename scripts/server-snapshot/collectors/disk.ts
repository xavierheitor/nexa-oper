import path from 'node:path';

import { appendCommandBlock, runCommand } from '../utils/shell';
import { getPathStat, sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

const DU_TARGETS = ['apps/api', 'apps/web', 'logs', 'uploads'] as const;

export async function collectDisk(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(12, 'Disco'));

  const df = await runCommand('df', ['-h']);
  appendCommandBlock(ctx.lines, 'df -h', 'df -h', df);

  ctx.lines.push('du -sh (quando existirem):');

  for (const relativePath of DU_TARGETS) {
    const absolutePath = path.join(ctx.repoRoot, relativePath);
    const info = await getPathStat(absolutePath);

    if (!info.exists) {
      ctx.lines.push(`${relativePath}: ✘ não existe`);
      continue;
    }

    const du = await runCommand('du', ['-sh', absolutePath]);
    ctx.lines.push(`${relativePath}: ${du.stdout || info.size || 'n/d'}`);
  }

  const uploadRoot = ctx.envValues.get('UPLOAD_ROOT');
  if (uploadRoot) {
    const resolved = path.isAbsolute(uploadRoot)
      ? uploadRoot
      : path.join(ctx.repoRoot, uploadRoot);
    const du = await runCommand('du', ['-sh', resolved]);
    ctx.lines.push(`UPLOAD_ROOT: ${du.stdout || 'n/d'} (${resolved})`);
  }

  ctx.lines.push('');
}
