import { Inject, Injectable } from '@nestjs/common';
import type {
  SyncManifestContract,
  SyncScopeContract,
} from '../../../../contracts/sync/sync.contract';
import {
  SYNC_READER,
  type SyncReaderPort,
} from '../../domain/ports/sync-reader.port';

export type BuildSyncManifestResult =
  | { statusCode: 304 }
  | { statusCode: 200; etag: string; manifest: SyncManifestContract };

@Injectable()
export class BuildSyncManifestUseCase {
  constructor(@Inject(SYNC_READER) private readonly reader: SyncReaderPort) {}

  async execute(
    scope: SyncScopeContract,
    ifNoneMatch?: string,
  ): Promise<BuildSyncManifestResult> {
    const { manifest, etag } = await this.reader.buildManifest(scope);

    if (ifNoneMatch && ifNoneMatch === etag) {
      return { statusCode: 304 };
    }

    return { statusCode: 200, etag, manifest };
  }
}
