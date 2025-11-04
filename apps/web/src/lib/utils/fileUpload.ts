/**
 * Utilitários para upload de arquivos
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { extname } from 'path';

/**
 * Diretório base para uploads de anexos de justificativas
 */
const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'justificativas', 'anexos')
  : join(process.cwd(), 'uploads', 'justificativas', 'anexos');

/**
 * URL base pública para acessar os anexos
 * Por padrão, usa caminho relativo que será servido pelo Next.js
 */
const UPLOAD_PUBLIC_PREFIX = process.env.UPLOAD_BASE_URL || '/uploads/justificativas/anexos';

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

  // Montar path relativo para o banco
  const dbPath = `/justificativas/anexos/${relativePath}`;
  const publicUrl = `${UPLOAD_PUBLIC_PREFIX}/${relativePath}`;

  return {
    filePath: dbPath,
    url: publicUrl,
    mimeType: file.type,
  };
}

