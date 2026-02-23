import { Inject, Injectable } from '@nestjs/common';
import type {
  UploadEvidenceFileContract,
  UploadEvidenceRequestContract,
  UploadEvidenceResponseContract,
} from '../../../../contracts/upload/upload.contract';
import {
  UPLOAD_PROCESSOR,
  type UploadProcessorPort,
} from '../../domain/ports/upload-processor.port';

@Injectable()
export class UploadEvidenceUseCase {
  constructor(
    @Inject(UPLOAD_PROCESSOR) private readonly processor: UploadProcessorPort,
  ) {}

  execute(
    file: UploadEvidenceFileContract,
    body: UploadEvidenceRequestContract,
  ): Promise<UploadEvidenceResponseContract> {
    return this.processor.upload(file, body);
  }
}
