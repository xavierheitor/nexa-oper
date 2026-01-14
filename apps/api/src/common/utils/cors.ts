export function getCorsOrigins():
  | (string | boolean)[]
  | ((origin: string | undefined) => boolean) {
  const corsOriginsEnv = process.env.CORS_ORIGINS;

  // 1. Se não definido ou vazio
  if (!corsOriginsEnv || !corsOriginsEnv.trim()) {
    // Em produção, negar tudo se não houver configuração explícita
    if (process.env.NODE_ENV === 'production') {
      return () => false;
    }
    // Em desenvolvimento/test, libera todas as origens para facilitar
    return () => true;
  }

  // 2. Tentar parsing como JSON
  try {
    const parsed = JSON.parse(corsOriginsEnv);
    if (Array.isArray(parsed)) {
      const validOrigins = parsed.filter(
        (origin: unknown) => typeof origin === 'string' && origin.trim() !== ''
      );
      // Se array válido (com strings), retorna. Se vazio (ou só invalidos), nega.
      return validOrigins.length > 0 ? validOrigins : () => false;
    }
  } catch {
    // Não é JSON válido, segue para CSV
  }

  // 3. Parsing como CSV
  const origins = corsOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Se o usuário colocou "*", liberamos tudo explicitamente
  if (origins.includes('*')) {
    return () => true;
  }

  // Se resultou em array com itens, retorna. Senão, nega.
  return origins.length > 0 ? origins : () => false;
}
