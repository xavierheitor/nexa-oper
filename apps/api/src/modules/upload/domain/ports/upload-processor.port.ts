import type {
  UploadEvidenceFileContract,
  UploadEvidenceRequestContract,
  UploadEvidenceResponseContract,
} from '../../../../contracts/upload/upload.contract';

export const UPLOAD_PROCESSOR = Symbol('UPLOAD_PROCESSOR');

export interface UploadProcessorPort {
  upload(
    file: UploadEvidenceFileContract,
    body: UploadEvidenceRequestContract,
  ): Promise<UploadEvidenceResponseContract>;
}
