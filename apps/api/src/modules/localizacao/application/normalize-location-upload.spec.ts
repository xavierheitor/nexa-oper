import {
  normalizeLocationUpload,
  resolveCapturedAt,
  resolveEventCategory,
} from './normalize-location-upload';

describe('resolveCapturedAt', () => {
  it('prefers capturedAt over timestamp', () => {
    const date = resolveCapturedAt({
      capturedAt: '2025-06-01T16:34:00.000Z',
      timestamp: '2025-06-01T17:00:00.000Z',
    });

    expect(date.toISOString()).toBe('2025-06-01T16:34:00.000Z');
  });

  it('falls back to timestamp when capturedAt is absent', () => {
    const date = resolveCapturedAt({
      timestamp: '2025-06-01T16:34:00.000Z',
    });

    expect(date.toISOString()).toBe('2025-06-01T16:34:00.000Z');
  });
});

describe('resolveEventCategory', () => {
  it('prefers eventCategory over tagType', () => {
    expect(resolveEventCategory('apr_inicio', 'periodic')).toBe('apr_inicio');
  });

  it('maps legacy turnoOpen and turnoClose', () => {
    expect(resolveEventCategory(undefined, 'turnoOpen')).toBe('turno_inicio');
    expect(resolveEventCategory(undefined, 'turnoClose')).toBe('turno_fim');
  });

  it('maps legacy custom apr_submission to apr_fim', () => {
    expect(resolveEventCategory(undefined, 'custom', 'apr_submission')).toBe(
      'apr_fim',
    );
  });

  it('keeps canonical categories unchanged', () => {
    expect(resolveEventCategory('foto_capturada')).toBe('foto_capturada');
    expect(resolveEventCategory(undefined, 'periodic')).toBe('periodic');
  });
});

describe('normalizeLocationUpload', () => {
  it('normalizes new payload with eventCategory and timestamp', () => {
    const normalized = normalizeLocationUpload({
      turnoId: 1,
      latitude: -16.73,
      longitude: -18.83,
      eventCategory: 'apr_inicio',
      tagType: 'apr_inicio',
      timestamp: '2025-06-01T16:34:00.000Z',
    });

    expect(normalized).toEqual({
      capturedAt: new Date('2025-06-01T16:34:00.000Z'),
      eventCategory: 'apr_inicio',
      tagType: 'apr_inicio',
      tagDetail: null,
    });
  });

  it('normalizes legacy payload with only tagType', () => {
    const normalized = normalizeLocationUpload({
      turnoId: 1,
      latitude: -16.73,
      longitude: -18.83,
      tagType: 'turnoOpen',
    });

    expect(normalized.eventCategory).toBe('turno_inicio');
    expect(normalized.tagType).toBe('turno_inicio');
  });
});
