import * as path from 'node:path';

const API_UPLOADS_TOKEN = '/api/uploads/';
const UPLOADS_TOKEN = '/uploads/';
const MOBILE_PHOTOS_TOKEN = '/mobile/photos/';

function normalizeSlashes(value: string): string {
  return value.replace(/[\\]+/g, '/');
}

function extractPathnameFromUrl(value: string): string | null {
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

function normalizeRelativeUploadPathValue(value: string): string | null {
  const trimmed = normalizeSlashes(String(value || '').trim());
  if (!trimmed) return null;

  const pathname = extractPathnameFromUrl(trimmed);
  if (pathname) {
    return normalizeRelativeUploadPathValue(pathname);
  }

  if (trimmed.startsWith(MOBILE_PHOTOS_TOKEN)) {
    return `mobile/photos/${trimmed.slice(MOBILE_PHOTOS_TOKEN.length)}`;
  }
  if (trimmed.startsWith(MOBILE_PHOTOS_TOKEN.slice(1))) {
    return `mobile/photos/${trimmed.slice(MOBILE_PHOTOS_TOKEN.length - 1)}`;
  }

  if (trimmed.startsWith(API_UPLOADS_TOKEN)) {
    return trimmed.slice(API_UPLOADS_TOKEN.length);
  }
  if (trimmed.startsWith(API_UPLOADS_TOKEN.slice(1))) {
    return trimmed.slice(API_UPLOADS_TOKEN.length - 1);
  }

  if (trimmed.startsWith(UPLOADS_TOKEN)) {
    return trimmed.slice(UPLOADS_TOKEN.length);
  }
  if (trimmed.startsWith(UPLOADS_TOKEN.slice(1))) {
    return trimmed.slice(UPLOADS_TOKEN.length - 1);
  }

  const lower = trimmed.toLowerCase();
  const apiUploadsIndex = lower.lastIndexOf(API_UPLOADS_TOKEN);
  if (apiUploadsIndex >= 0) {
    return trimmed.slice(apiUploadsIndex + API_UPLOADS_TOKEN.length);
  }

  const uploadsIndex = lower.lastIndexOf(UPLOADS_TOKEN);
  if (uploadsIndex >= 0) {
    return trimmed.slice(uploadsIndex + UPLOADS_TOKEN.length);
  }

  if (path.isAbsolute(trimmed) || /^[a-zA-Z]:\//.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(/^\/+/, '');
  if (!normalized) return null;
  return normalized;
}

export function resolveStoredUploadPath(
  urlValue?: string | null,
  pathValue?: string | null,
): string | null {
  return (
    normalizeRelativeUploadPathValue(String(urlValue ?? '')) ??
    normalizeRelativeUploadPathValue(String(pathValue ?? ''))
  );
}

export function buildStoredUploadUrl(relativePath: string): string {
  const normalized = normalizeRelativeUploadPathValue(relativePath);
  if (!normalized) {
    throw new Error('Relative upload path is required');
  }
  return `/uploads/${normalized}`;
}

type UploadLike = {
  path: string;
  url: string;
  size: number;
  mimeType?: string;
  filename?: string;
};

export function normalizeStoredUploadResult<T extends UploadLike>(result: T): T {
  const normalizedPath =
    resolveStoredUploadPath(result.url, result.path) ??
    normalizeRelativeUploadPathValue(result.path);
  if (!normalizedPath) {
    return result;
  }

  return {
    ...result,
    path: normalizedPath,
    url: buildStoredUploadUrl(normalizedPath),
  };
}
