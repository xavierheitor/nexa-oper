import { createHash } from 'crypto';

/**
 * Gera checksum SHA-256 do payload de sync para comparação com o cliente.
 * Usado por APR, Checklist, Equipe e Eletricista sync.
 */
export function computeSyncChecksum(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
