import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

function parseEnvContent(raw) {
  const out = {};
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    out[key] = value;
  }

  return out;
}

function hasWorkspaceConfig(dir) {
  const packageJsonPath = join(dir, 'package.json');
  if (!existsSync(packageJsonPath)) return false;

  try {
    const raw = readFileSync(packageJsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Boolean(parsed.workspaces);
  } catch {
    return false;
  }
}

function findWorkspaceRoot(startDir) {
  let current = resolve(startDir);

  while (true) {
    if (hasWorkspaceConfig(current)) return current;
    const parent = dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function loadEnvChain() {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const workspaceRoot = findWorkspaceRoot(packageRoot);

  const files = [join(packageRoot, '.env.local'), join(packageRoot, '.env')];
  if (workspaceRoot !== packageRoot) {
    files.push(join(workspaceRoot, '.env.local'));
    files.push(join(workspaceRoot, '.env'));
  }

  for (const file of files) {
    if (existsSync(file)) {
      const raw = readFileSync(file, 'utf8');
      const parsed = parseEnvContent(raw);
      for (const [key, value] of Object.entries(parsed)) {
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    }
  }
}

function run() {
  const [, , command, ...args] = process.argv;
  if (!command) {
    console.error('Uso: node scripts/with-env.mjs <comando> [args...]');
    process.exit(1);
  }

  loadEnvChain();

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}

run();
