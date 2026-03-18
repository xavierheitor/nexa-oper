const API_UPLOADS_TOKEN = '/api/uploads/';
const UPLOADS_TOKEN = '/uploads/';
const MOBILE_PHOTOS_TOKEN = '/mobile/photos/';

function isBrowserUrl(value: string): boolean {
  return value.startsWith('data:') || value.startsWith('blob:');
}

function isRemoteUrl(value: string): boolean {
  if (value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractRemotePathname(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.pathname;
  } catch {
    return null;
  }
}

function extractPublicUploadPath(value: string): string | null {
  const normalized = value.replace(/[\\]+/g, '/');

  const pathname = extractRemotePathname(normalized);
  if (pathname) {
    return extractPublicUploadPath(pathname);
  }

  if (normalized.startsWith(MOBILE_PHOTOS_TOKEN)) {
    return `/uploads/${normalized.slice(MOBILE_PHOTOS_TOKEN.length)}`;
  }
  if (normalized.startsWith(MOBILE_PHOTOS_TOKEN.slice(1))) {
    return `/uploads/${normalized.slice(MOBILE_PHOTOS_TOKEN.length - 1)}`;
  }

  if (normalized.startsWith(API_UPLOADS_TOKEN)) {
    return `/uploads/${normalized.slice(API_UPLOADS_TOKEN.length)}`;
  }
  if (normalized.startsWith(API_UPLOADS_TOKEN.slice(1))) {
    return `/uploads/${normalized.slice(API_UPLOADS_TOKEN.length - 1)}`;
  }

  if (normalized.startsWith(UPLOADS_TOKEN)) {
    return normalized;
  }
  if (normalized.startsWith(UPLOADS_TOKEN.slice(1))) {
    return `/${normalized}`;
  }

  const lower = normalized.toLowerCase();
  const apiUploadsIndex = lower.lastIndexOf(API_UPLOADS_TOKEN);
  if (apiUploadsIndex >= 0) {
    return `/uploads/${normalized
      .slice(apiUploadsIndex + API_UPLOADS_TOKEN.length)
      .replace(/^\/+/, '')}`;
  }

  const uploadsIndex = lower.lastIndexOf(UPLOADS_TOKEN);
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  return null;
}

function normalizeUploadPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (isBrowserUrl(trimmed) || trimmed.startsWith('//')) return trimmed;

  const uploadPath = extractPublicUploadPath(trimmed);
  if (uploadPath) return uploadPath;

  if (isRemoteUrl(trimmed)) {
    const pathname = extractRemotePathname(trimmed);
    if (!pathname || pathname === '/') {
      return trimmed;
    }
    return `/uploads/${pathname.replace(/^\/+/, '')}`;
  }

  const normalized = trimmed.replace(/[\\]+/g, '/');
  if (normalized.startsWith('/')) {
    return `/uploads${normalized}`;
  }

  return `/uploads/${normalized}`;
}

function resolveUploadBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ||
    process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ||
    '';
  return base.trim();
}

function joinUploadBaseUrl(baseUrl: string, publicPath: string): string {
  const normalizedBaseUrl = baseUrl.endsWith('/')
    ? baseUrl.slice(0, -1)
    : baseUrl;

  if (
    normalizedBaseUrl.endsWith('/uploads') &&
    publicPath.startsWith('/uploads/')
  ) {
    return `${normalizedBaseUrl}${publicPath.slice('/uploads'.length)}`;
  }

  return `${normalizedBaseUrl}${publicPath}`;
}

export function buildUploadUrl(
  uploadPath?: string | null,
  fallbackPath?: string
): string {
  const rawPath = uploadPath || fallbackPath || '';
  if (!rawPath || rawPath.trim() === '') {
    return '';
  }

  const normalizedPath = normalizeUploadPath(rawPath);
  if (!normalizedPath) return '';
  if (isBrowserUrl(normalizedPath) || normalizedPath.startsWith('//')) {
    return normalizedPath;
  }

  const baseUrl = resolveUploadBaseUrl();
  if (!baseUrl) {
    return normalizedPath;
  }

  return joinUploadBaseUrl(baseUrl, normalizedPath);
}

export function buildPhotoUrl(photoPath?: string | null, fallbackPath?: string): string {
  return buildUploadUrl(photoPath, fallbackPath);
}

export function isValidUploadPath(uploadPath?: string | null): boolean {
  return Boolean(uploadPath && uploadPath.trim() !== '');
}

export function isValidPhotoPath(photoPath?: string | null): boolean {
  return isValidUploadPath(photoPath);
}
