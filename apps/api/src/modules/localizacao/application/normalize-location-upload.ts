import type { LocationUploadRequestContract } from '../../../contracts/localizacao/location-upload.contract';

const LEGACY_TAG_TYPE_MAP: Record<string, string> = {
  turnoOpen: 'turno_inicio',
  turnoClose: 'turno_fim',
};

export interface NormalizedLocationUpload {
  capturedAt: Date;
  eventCategory: string | null;
  tagType: string | null;
  tagDetail: string | null;
}

export function resolveCapturedAt(payload: {
  capturedAt?: string;
  timestamp?: string;
}): Date {
  const raw = payload.capturedAt ?? payload.timestamp;
  return raw ? new Date(raw) : new Date();
}

export function resolveEventCategory(
  eventCategory?: string | null,
  tagType?: string | null,
  tagDetail?: string | null,
): string | null {
  const raw = eventCategory ?? tagType ?? null;
  if (!raw) return null;

  const mapped = LEGACY_TAG_TYPE_MAP[raw];
  if (mapped) return mapped;

  if (raw === 'custom' && tagDetail === 'apr_submission') {
    return 'apr_fim';
  }

  return raw;
}

export function normalizeLocationUpload(
  payload: LocationUploadRequestContract,
): NormalizedLocationUpload {
  const capturedAt = resolveCapturedAt(payload);
  const eventCategory = resolveEventCategory(
    payload.eventCategory,
    payload.tagType,
    payload.tagDetail,
  );

  return {
    capturedAt,
    eventCategory,
    tagType: eventCategory,
    tagDetail: payload.tagDetail ?? null,
  };
}
