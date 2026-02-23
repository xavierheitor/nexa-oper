export type SyncModeContract = 'snapshot' | 'delta';

export interface SyncScopeContract {
  userId: number;
  contractIds: number[];
}

export interface SyncManifestCollectionContract {
  name: string;
  etag: string;
  mode: SyncModeContract;
}

export interface SyncManifestContract {
  serverTime: string;
  scopeHash: string;
  collections: Record<string, SyncManifestCollectionContract>;
}

export interface SyncManifestResultContract {
  manifest: SyncManifestContract;
  etag: string;
}

export interface SyncSnapshotResponseContract {
  serverTime: string;
  nextSince: null;
  items: unknown[];
  deletedIds: string[];
}

export interface SyncDeltaResponseContract {
  serverTime: string;
  nextSince: string;
  items: unknown[];
  deletedIds: string[];
}

export type SyncCollectionResponseContract =
  | SyncSnapshotResponseContract
  | SyncDeltaResponseContract;
