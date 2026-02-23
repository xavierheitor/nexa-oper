import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

function hasWorkspaceConfig(dir: string): boolean {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!existsSync(packageJsonPath)) return false;

  try {
    const raw = readFileSync(packageJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { workspaces?: unknown };
    return Boolean(parsed.workspaces);
  } catch {
    return false;
  }
}

export function findWorkspaceRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (hasWorkspaceConfig(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

export function resolveUploadRoot(configuredRoot?: string): string {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const raw = configuredRoot?.trim();

  if (!raw) {
    return path.join(workspaceRoot, 'uploads');
  }

  if (path.isAbsolute(raw)) {
    return path.resolve(raw);
  }

  return path.resolve(workspaceRoot, raw);
}
