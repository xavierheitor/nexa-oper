export function getCorsOrigins():
  | (string | boolean)[]
  | ((origin: string | undefined) => boolean) {
  const corsOriginsEnv = process.env.CORS_ORIGINS;

  if (!corsOriginsEnv || corsOriginsEnv.trim() === '') {
    // Em produção, negar tudo se não houver configuração explícita
    if (process.env.NODE_ENV === 'production') {
      return () => false;
    }
    // Em desenvolvimento/test, libera todas as origens para facilitar
    return () => true;
  }

  try {
    const parsed = JSON.parse(corsOriginsEnv);
    if (Array.isArray(parsed)) {
      const validOrigins = parsed.filter(
        (origin: any) => typeof origin === 'string'
      );
      // Se array vazio, negar
      return validOrigins.length > 0 ? validOrigins : () => false;
    }
  } catch {
    // ignore, tenta CSV
  }

  const origins = corsOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Se resultou em array vazio (ex: ","), negar
  return origins.length > 0 ? origins : () => false;
}
