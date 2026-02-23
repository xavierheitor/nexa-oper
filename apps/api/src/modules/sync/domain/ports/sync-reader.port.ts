import type {
  SyncDeltaResponseContract,
  SyncManifestResultContract,
  SyncModeContract,
  SyncScopeContract,
  SyncSnapshotResponseContract,
} from '../../../../contracts/sync/sync.contract';

export const SYNC_READER = Symbol('SYNC_READER');

export interface SyncCollectionDefPort {
  name: string;
  mode: SyncModeContract;
}

export interface SyncReaderPort {
  buildManifest(scope: SyncScopeContract): Promise<SyncManifestResultContract>;
  getCollectionDef(name: string): SyncCollectionDefPort;
  getCollectionSnapshot(
    name: string,
    scope: SyncScopeContract,
  ): Promise<SyncSnapshotResponseContract>;
  getCollectionDelta(
    name: string,
    scope: SyncScopeContract,
    params: { since: string; until: string },
  ): Promise<SyncDeltaResponseContract>;
}
