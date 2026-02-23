import { Inject, Injectable } from '@nestjs/common';
import type {
  SyncCollectionResponseContract,
  SyncScopeContract,
} from '../../../../contracts/sync/sync.contract';
import {
  SYNC_READER,
  type SyncReaderPort,
} from '../../domain/ports/sync-reader.port';

@Injectable()
export class GetSyncCollectionUseCase {
  constructor(@Inject(SYNC_READER) private readonly reader: SyncReaderPort) {}

  async execute(
    scope: SyncScopeContract,
    collectionName: string,
    params: { since?: string; until?: string },
  ): Promise<SyncCollectionResponseContract> {
    const def = this.reader.getCollectionDef(collectionName);
    const name = def.name;

    if (def.mode === 'snapshot') {
      return this.reader.getCollectionSnapshot(name, scope);
    }

    return this.reader.getCollectionDelta(name, scope, {
      since: params.since ?? '',
      until: params.until ?? new Date().toISOString(),
    });
  }
}
