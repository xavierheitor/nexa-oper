import { SyncStatusResponseDto } from '@common/dto/sync-status.dto';
import { computeSyncChecksum } from './sync-checksum';

/**
 * Monta a resposta do endpoint de status de sync (checksum, changed, serverTime).
 * Usado por APR, Checklist, Equipe e Eletricista sync.
 */
export function buildSyncStatusResponse(
  payload: unknown,
  clientChecksum?: string
): SyncStatusResponseDto {
  const checksum = computeSyncChecksum(payload);
  const serverTime = new Date().toISOString();
  const changed = clientChecksum === undefined || clientChecksum !== checksum;
  return { changed, checksum, serverTime };
}
