export function getCorsOrigins(): (string | boolean)[] | ((origin: string | undefined) => boolean) {
  const corsOriginsEnv = process.env.CORS_ORIGINS;

  if (!corsOriginsEnv || corsOriginsEnv.trim() === '') {
    // Em desenvolvimento, libera todas as origens para facilitar testes
    if (process.env.NODE_ENV === 'development') {
      return () => true; // Libera todas as origens
    }
    if (process.env.NODE_ENV === 'production') {
      return () => true;
    }
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  try {
    const parsed = JSON.parse(corsOriginsEnv);
    if (Array.isArray(parsed)) {
      return parsed.filter((origin: any) => typeof origin === 'string');
    }
  } catch {
    // ignore
  }

  const origins = corsOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  return origins.length > 0 ? origins : () => true;
}


