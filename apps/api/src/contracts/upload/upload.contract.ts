export interface UploadMetadataSpecContract {
  required?: readonly string[];
  optional?: readonly string[];
  description?: string;
}

export interface UploadTypesResponseContract {
  types: string[];
  metadataSpecs: Record<string, UploadMetadataSpecContract>;
}

/**
 * Contrato externo de entrada para upload de evidências.
 * Campos extras de metadata são permitidos e validados por handler específico.
 */
export interface UploadEvidenceRequestContract {
  type: string;
  entityId: string;
  entityType?: string;
  [key: string]: unknown;
}

export interface UploadEvidenceFileContract {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

export interface UploadEvidenceResponseContract {
  url: string;
  path: string;
  size: number;
  mimeType?: string;
  filename?: string;
}
