import { Injectable } from '@nestjs/common';
import type { UploadTypesResponseContract } from '../../../../contracts/upload/upload.contract';
import type { MetadataSpec } from '../../evidence/evidence.handler';
import { UploadRegistry } from '../../upload.registry';

@Injectable()
export class ListUploadTypesUseCase {
  constructor(private readonly registry: UploadRegistry) {}

  execute(): UploadTypesResponseContract {
    const types = this.registry.listTypes();
    const specs = Object.fromEntries(
      types
        .map((t): [string, MetadataSpec | undefined] => [
          t,
          this.registry.getMetadataSpec(t),
        ])
        .filter((entry): entry is [string, MetadataSpec] => entry[1] != null),
    );

    return {
      types,
      metadataSpecs: specs,
    };
  }
}
