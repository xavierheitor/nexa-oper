import { Injectable } from '@nestjs/common';
import { AppError } from '../../../core/errors/app-error';
import type { StorageAdapter } from './storage.adapter';
import type { StorageUploadInput } from './storage.adapter';
import type { StorageUploadResult } from './storage.adapter';

/**
 * S3 Storage Adapter.
 * Requires @aws-sdk/client-s3 and env: AWS_S3_BUCKET, AWS_REGION.
 * Optional: AWS_S3_ENDPOINT (for MinIO/R2), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
 */
@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    // Lazy load to avoid requiring @aws-sdk/client-s3 when using local storage
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const bucket = process.env.AWS_S3_BUCKET ?? '';
    const region = process.env.AWS_REGION ?? 'us-east-1';
    const endpoint = process.env.AWS_S3_ENDPOINT;
    const publicUrl =
      process.env.AWS_S3_PUBLIC_URL ??
      `https://${bucket}.s3.${region}.amazonaws.com`;

    if (!bucket) {
      throw AppError.internal(
        'AWS_S3_BUCKET é obrigatório para uso do storage S3',
      );
    }

    const client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      ...(process.env.AWS_ACCESS_KEY_ID && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      }),
    });

    const key = input.path.replace(/^\//, '');
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType ?? 'application/octet-stream',
      }),
    );

    const url = publicUrl.endsWith('/')
      ? `${publicUrl}${key}`
      : `${publicUrl}/${key}`;

    return {
      path: input.path,
      size: input.size,
      url,
      mimeType: input.mimeType,
      filename: key.split('/').pop(),
    };
  }

  async delete(filePath: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } =
      await import('@aws-sdk/client-s3');
    const bucket = process.env.AWS_S3_BUCKET ?? '';
    const region = process.env.AWS_REGION ?? 'us-east-1';
    const endpoint = process.env.AWS_S3_ENDPOINT;

    if (!bucket) {
      throw AppError.internal(
        'AWS_S3_BUCKET é obrigatório para uso do storage S3',
      );
    }

    const client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      ...(process.env.AWS_ACCESS_KEY_ID && {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        },
      }),
    });

    const key = String(filePath).replace(/^[/\\]+/, '');
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }
}
