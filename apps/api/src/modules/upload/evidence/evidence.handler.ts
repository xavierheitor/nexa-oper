export interface EvidenceContext {
  type: string;
  entityId: string;
  entityType: string;
  metadata: Record<string, any>;
}

export interface MetadataSpec {
  required?: readonly string[];
  optional?: readonly string[];
  description?: string;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType?: string;
  filename?: string;
}

export interface EvidenceHandler {
  readonly type: string;
  metadataSpec?: MetadataSpec;
  validate(ctx: EvidenceContext): Promise<void>;
  buildStoragePath(ctx: EvidenceContext, filename: string): string;
  persist(ctx: EvidenceContext, upload: UploadResult): Promise<void>;
}
