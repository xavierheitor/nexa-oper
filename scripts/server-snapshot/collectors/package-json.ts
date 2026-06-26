import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { sectionTitle } from '../utils/fs-helpers';
import type { SnapshotContext } from '../types';

export async function collectPackageJson(ctx: SnapshotContext): Promise<void> {
  ctx.lines.push(sectionTitle(4, 'package.json'));

  const packagePath = path.join(ctx.repoRoot, 'package.json');

  try {
    const raw = await readFile(packagePath, 'utf8');
    const pkg = JSON.parse(raw) as {
      scripts?: Record<string, string>;
      workspaces?: string[] | { packages?: string[] };
      engines?: Record<string, string>;
      packageManager?: string;
    };

    ctx.lines.push(`Arquivo: ${packagePath}`);
    ctx.lines.push('');
    ctx.lines.push('scripts:');
    for (const [name, command] of Object.entries(pkg.scripts ?? {}).sort()) {
      ctx.lines.push(`  ${name}: ${command}`);
    }

    ctx.lines.push('');
    ctx.lines.push('workspaces:');
    const workspaces = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces?.packages ?? [];
    if (!workspaces.length) {
      ctx.lines.push('  (não definido)');
    } else {
      for (const ws of workspaces) ctx.lines.push(`  - ${ws}`);
    }

    ctx.lines.push('');
    ctx.lines.push('engines:');
    if (!pkg.engines || !Object.keys(pkg.engines).length) {
      ctx.lines.push('  (não definido)');
    } else {
      for (const [name, value] of Object.entries(pkg.engines)) {
        ctx.lines.push(`  ${name}: ${value}`);
      }
    }

    ctx.lines.push('');
    ctx.lines.push(`packageManager: ${pkg.packageManager ?? '(não definido)'}`);
    ctx.lines.push('');
  } catch {
    ctx.problems.push('package.json da raiz não encontrado ou inválido');
    ctx.lines.push('(não foi possível ler package.json)');
    ctx.lines.push('');
  }
}
