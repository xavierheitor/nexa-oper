/**
 * Utilitários para Manipulação de URLs de Fotos
 *
 * Este módulo fornece funções helper para construir URLs completas
 * para fotos enviadas pelo aplicativo mobile, permitindo configuração
 * de URL base através de variáveis de ambiente.
 *
 * FUNCIONALIDADES:
 * - Monta URLs completas de fotos com base configurável
 * - Suporta paths relativos vindos do servidor
 * - Configurável via variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL
 * - Fallback automático para path relativo se não configurado
 *
 * COMO FUNCIONA:
 * 1. Lê variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL
 * 2. Se configurada, concatena com o path da foto
 * 3. Normaliza slashes para evitar duplicações
 * 4. Retorna URL completa ou path relativo
 *
 * CONFIGURAÇÃO:
 * No arquivo .env.local:
 * NEXT_PUBLIC_PHOTOS_BASE_URL=http://localhost:3001
 * ou
 * NEXT_PUBLIC_PHOTOS_BASE_URL=https://storage.nexaoper.com.br
 * ou
 * NEXT_PUBLIC_UPLOAD_BASE_URL=https://storage.nexaoper.com.br/uploads
 *
 * SEGURANÇA:
 * - Usa variáveis de ambiente públicas (NEXT_PUBLIC_*)
 * - Não expõe informações sensíveis
 * - Suporta HTTPS/HTTP
 */

/**
 * Constrói a URL completa para uma foto mobile
 *
 * Esta função monta a URL completa para uma foto, usando a URL base
 * configurada na variável de ambiente NEXT_PUBLIC_PHOTOS_BASE_URL se
 * disponível. Caso contrário, retorna o path relativo.
 *
 * @param photoPath - Path da foto (relativo ou absoluto)
 * @param fallbackPath - Path alternativo caso photoPath seja inválido
 * @returns URL completa da foto ou path relativo
 *
 * @example
 * ```typescript
 * // Com URL base configurada:
 * buildPhotoUrl('/uploads/checklists/123/photo.jpg')
 * // => 'https://storage.nexaoper.com.br/uploads/checklists/123/photo.jpg'
 *
 * // Sem URL base:
 * buildPhotoUrl('/mobile/photos/123/photo.jpg')
 * // => '/mobile/photos/123/photo.jpg'
 *
 * // Com fallback:
 * buildPhotoUrl('', '/mobile/photos/default.jpg')
 * // => 'https://storage.nexaoper.com.br/mobile/photos/default.jpg'
 * ```
 */
function isAbsoluteUrl(value: string): boolean {
  if (value.startsWith('data:') || value.startsWith('blob:')) return true;
  if (value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizePhotoPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (isAbsoluteUrl(trimmed)) return trimmed;
  const normalized = trimmed.replace(/[\\]+/g, '/');

  // Compatibilidade legado: URLs sem prefixo /uploads
  if (normalized.startsWith('/mobile/photos/')) return `/uploads${normalized}`;
  if (normalized.startsWith('mobile/photos/')) return `/uploads/${normalized}`;

  // Compatibilidade legado: caminho absoluto do SO (ex: /var/www/.../uploads/mobile/photos/...)
  const uploadsToken = '/uploads/';
  const uploadsIndex = normalized.toLowerCase().lastIndexOf(uploadsToken);
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  if (normalized.startsWith('/uploads/')) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;
  if (normalized.startsWith('/')) return normalized;

  // storagePath legado salvo sem prefixo público (ex.: "checklists/...")
  return `/uploads/${normalized}`;
}

function resolvePhotoBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ||
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    '';
  return base.trim();
}

export function buildPhotoUrl(photoPath?: string | null, fallbackPath?: string): string {
  const rawPath = photoPath || fallbackPath || '';
  if (!rawPath || rawPath.trim() === '') {
    return '';
  }

  const normalizedPath = normalizePhotoPath(rawPath);
  if (!normalizedPath) return '';
  if (isAbsoluteUrl(normalizedPath)) return normalizedPath;

  const baseUrl = resolvePhotoBaseUrl();
  if (!baseUrl || baseUrl.trim() === '') {
    return normalizedPath;
  }

  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // Evita duplicação quando a base já contém "/uploads"
  if (
    normalizedBaseUrl.endsWith('/uploads') &&
    normalizedPath.startsWith('/uploads/')
  ) {
    return `${normalizedBaseUrl}${normalizedPath.slice('/uploads'.length)}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

/**
 * Type guard para verificar se uma foto tem URL válida
 *
 * @param photoPath - Path da foto a ser validado
 * @returns true se o path é válido e não vazio
 */
export function isValidPhotoPath(photoPath?: string | null): boolean {
  return Boolean(photoPath && photoPath.trim() !== '');
}
