export function extractPrismaError(error: unknown): {
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
} | null {
  if (!error || typeof error !== 'object') return null;

  const raw = error as Record<string, unknown>;
  const code = typeof raw.code === 'string' ? raw.code : undefined;
  const message = typeof raw.message === 'string' ? raw.message : undefined;
  const meta =
    raw.meta && typeof raw.meta === 'object'
      ? (raw.meta as Record<string, unknown>)
      : undefined;

  return { code, meta, message };
}

export function isPrismaUniqueConstraintError(
  error: unknown,
  hint: string,
): boolean {
  const known = extractPrismaError(error);
  if (known?.code !== 'P2002') return false;

  const normalizedHint = hint.toLowerCase();
  const parts = [known.meta?.target, known.meta?.constraint, known.message];

  return parts.some((part) => {
    if (typeof part === 'string') {
      return part.toLowerCase().includes(normalizedHint);
    }
    if (Array.isArray(part)) {
      return part.some(
        (item) =>
          typeof item === 'string' &&
          item.toLowerCase().includes(normalizedHint),
      );
    }
    return false;
  });
}
