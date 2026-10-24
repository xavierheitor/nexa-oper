import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import type {
  StorageAdapter,
  StorageUploadInput,
  StorageUploadResult,
} from './storage.adapter';
import { buildStoredUploadUrl } from './upload-url';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET?.trim() ?? '';
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET é obrigatório para uso do storage S3');
    }
    const endpoint = process.env.AWS_S3_ENDPOINT?.trim();
    this.client = new S3Client({
      region: process.env.AWS_REGION?.trim()
        ? process.env.AWS_REGION.trim()
        : 'us-east-1',
      endpoint: endpoint ? endpoint : undefined,
      forcePathStyle:
        process.env.AWS_S3_FORCE_PATH_STYLE === undefined
          ? Boolean(endpoint)
          : process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const key = input.path.replace(/^[/\\]+/, '');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentLength: input.buffer.length,
        ContentType: input.mimeType || 'application/octet-stream',
      }),
    );
    return {
      path: key,
      size: input.size,
      url: buildStoredUploadUrl(key),
      mimeType: input.mimeType,
      filename: key.split('/').pop(),
    };
  }

  async delete(filePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath.replace(/^[/\\]+/, ''),
      }),
    );
  }

  read(
    key: string,
    options: Omit<GetObjectCommandInput, 'Bucket' | 'Key'>,
    signal: AbortSignal,
  ) {
    return this.client.send(
      new GetObjectCommand({ ...options, Bucket: this.bucket, Key: key }),
      { abortSignal: signal },
    );
  }

  head(
    key: string,
    options: Omit<GetObjectCommandInput, 'Bucket' | 'Key'>,
    signal: AbortSignal,
  ) {
    return this.client.send(
      new HeadObjectCommand({ ...options, Bucket: this.bucket, Key: key }),
      { abortSignal: signal },
    );
  }
}
