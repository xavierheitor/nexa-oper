import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let client: S3Client | undefined;

/** Backend-only storage for uploads originating in Next.js server routes. */
export async function storeServerUpload(
  key: string,
  buffer: Buffer,
  contentType: string,
  localPath: string
): Promise<void> {
  const storage = process.env.UPLOAD_STORAGE || 'local';
  if (storage === 'local') {
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, buffer);
    return;
  }
  if (storage !== 's3') throw new Error('UPLOAD_STORAGE inválido');
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) throw new Error('AWS_S3_BUCKET obrigatório');
  const endpoint = process.env.AWS_S3_ENDPOINT?.trim();
  client ??= new S3Client({
    region: process.env.AWS_REGION?.trim() || 'us-east-1',
    endpoint: endpoint || undefined,
    forcePathStyle:
      process.env.AWS_S3_FORCE_PATH_STYLE === undefined
        ? Boolean(endpoint)
        : process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentLength: buffer.length,
      ContentType: contentType,
    })
  );
}
