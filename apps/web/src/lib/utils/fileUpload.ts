/**
 * Utilitários para upload de arquivos
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { randomUUID } from 'crypto';
import { extname } from 'path';

function hasWorkspaceConfig(dir: string): boolean {
  const packageJsonPath = join(dir, 'package.json');
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
  let current = startDir;

  while (true) {
    if (hasWorkspaceConfig(current)) return current;
    const parent = dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

function resolveSharedUploadRoot(configuredRoot?: string): string {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const raw = configuredRoot?.trim();

  if (!raw) {
    return join(workspaceRoot, 'uploads');
  }

  return isAbsolute(raw) ? raw : join(workspaceRoot, raw);
}

/**
 * Diretório base (absoluto) para uploads de anexos de justificativas.
 * Configurável via variável de ambiente UPLOAD_ROOT
 *
 * Se UPLOAD_ROOT estiver configurada, usa: {UPLOAD_ROOT}/justificativas/anexos
 * Caso contrário, usa: {workspaceRoot}/uploads/justificativas/anexos
 */
const UPLOAD_ROOT = join(
  resolveSharedUploadRoot(process.env.UPLOAD_ROOT),
  'justificativas',
  'anexos'
);

/**
 * URL base pública para acessar os anexos.
 * Se UPLOAD_BASE_URL estiver configurada, será usada como base (ex: https://storage.nexaoper.com.br).
 * Caso contrário, usa path relativo para servir via Next.js (ex: /uploads/justificativas/anexos).
 */
const UPLOAD_PUBLIC_PREFIX = process.env.UPLOAD_BASE_URL
  ? process.env.UPLOAD_BASE_URL
  : '/uploads/justificativas/anexos';

/**
 * Tipos MIME permitidos
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Mapeamento de tipos MIME para extensões
 */
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Tamanho máximo do arquivo (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Valida um arquivo antes do upload
 */
export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo excede o tamanho máximo permitido (10MB)');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, WEBP ou PDF');
  }
}

/**
 * Resolve a extensão do arquivo
 */
function resolveExtension(file: File): string {
  if (MIME_EXTENSION_MAP[file.type]) {
    return MIME_EXTENSION_MAP[file.type];
  }

  const originalExt = extname(file.name);
  if (originalExt) {
    return originalExt.replace('.', '').toLowerCase();
  }

  return 'bin';
}

/**
 * Faz upload de um arquivo e retorna o caminho relativo
 */
export async function uploadFile(
  file: File,
  justificativaId: number
): Promise<{
  filePath: string;
  url: string;
  mimeType: string;
}> {
  validateFile(file);

  const extension = resolveExtension(file);
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .replace(/\..+/, '');

  const fileName = `${justificativaId}_${timestamp}_${randomUUID()}.${extension}`;
  const relativePath = `${justificativaId}/${fileName}`;
  const absolutePath = join(UPLOAD_ROOT, relativePath);

  // Garantir que o diretório existe
  await mkdir(dirname(absolutePath), { recursive: true });

  // Converter File para Buffer e salvar
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(absolutePath, buffer);

  // Montar path relativo para o banco (sem UPLOAD_ROOT, apenas o caminho relativo)
  const dbPath = `/justificativas/anexos/${relativePath}`;

  // Montar URL pública
  // Se UPLOAD_BASE_URL estiver configurada, concatena com o path
  // Caso contrário, usa path relativo
  let publicUrl: string;
  if (process.env.UPLOAD_BASE_URL) {
    const baseUrl = UPLOAD_PUBLIC_PREFIX.endsWith('/')
      ? UPLOAD_PUBLIC_PREFIX.slice(0, -1)
      : UPLOAD_PUBLIC_PREFIX;
    publicUrl = `${baseUrl}/justificativas/anexos/${relativePath}`;
  } else {
    publicUrl = `${UPLOAD_PUBLIC_PREFIX}/${relativePath}`;
  }

  return {
    filePath: dbPath,
    url: publicUrl,
    mimeType: file.type,
  };
}
