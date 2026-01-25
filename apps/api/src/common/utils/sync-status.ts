import { SyncStatusResponseDto } from '@common/dto/sync-status.dto';
import { computeSyncChecksum } from './sync-checksum';

/**
 * Uso recomendado: serviços de sync (APR, Checklist, Equipe, Eletricista) para padronizar a resposta de status.
 * Monta a resposta do endpoint de status de sync (checksum, changed, serverTime).
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
