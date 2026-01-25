import { createHash } from 'crypto';

/**
 * Uso recomendado: serviços de sync para gerar checksum do payload; utilizado por buildSyncStatusResponse.
 * Gera checksum SHA-256 do payload de sync para comparação com o cliente.
 */
export function computeSyncChecksum(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
