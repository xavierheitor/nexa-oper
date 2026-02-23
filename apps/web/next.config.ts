import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { config as dotenvConfig } from 'dotenv';

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

function findWorkspaceRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (hasWorkspaceConfig(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function loadMonorepoEnv(): void {
  const appRoot = __dirname;
  const workspaceRoot = findWorkspaceRoot(appRoot);
  const files = [path.join(appRoot, '.env.local'), path.join(appRoot, '.env')];

  if (workspaceRoot !== appRoot) {
    files.push(path.join(workspaceRoot, '.env.local'));
    files.push(path.join(workspaceRoot, '.env'));
  }

  for (const file of files) {
    if (existsSync(file)) {
      dotenvConfig({ path: file });
    }
  }
}

function resolveUploadProxyTarget(): string | null {
  const raw =
    process.env.UPLOAD_PROXY_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (raw) {
    return raw.replace(/\/+$/g, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  return null;
}

loadMonorepoEnv();
const uploadProxyTarget = resolveUploadProxyTarget();

const nextConfig: NextConfig = {
  /* config options here */
  // Configuração ESLint - permite que o build continue mesmo com warnings
  eslint: {
    // Ignora erros do ESLint durante o build (warnings já são ignorados por padrão)
    // Apenas erros TypeScript críticos ainda fazem o build falhar
    ignoreDuringBuilds: true,
  },
  // Configuração para servir arquivos estáticos de uploads
  async rewrites() {
    if (!uploadProxyTarget) return [];

    return [
      {
        source: '/uploads/:path*',
        destination: `${uploadProxyTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
