import { maskValue } from './mask';

export function parseEnvContent(raw: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
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

export function formatEnvFile(
  filePath: string,
  content: string,
): string[] {
  const lines: string[] = [`Arquivo: ${filePath}`];
  const parsed = parseEnvContent(content);
  const keys = Object.keys(parsed).sort((a, b) => a.localeCompare(b));

  if (!keys.length) {
    lines.push('(nenhuma variável encontrada)');
    lines.push('');
    return lines;
  }

  for (const key of keys) {
    lines.push(`${key}=${maskValue(key, parsed[key])}`);
  }

  lines.push('');
  return lines;
}

export function parseDatabaseUrl(url: string): {
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  error?: string;
} {
  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '');

    return {
      host: parsed.hostname || undefined,
      port: parsed.port || undefined,
      database: database || undefined,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    };
  } catch {
    return { error: 'DATABASE_URL inválida ou não parseável' };
  }
}
