import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { env } from '../../../core/config/env';
import { AppError } from '../../../core/errors/app-error';
import { resolveUploadRoot } from '../../../core/config/workspace-paths';
import {
  StorageAdapter,
  type StorageUploadInput,
  type StorageUploadResult,
} from './storage.adapter';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly basePath = resolveUploadRoot(env.UPLOAD_ROOT);

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const relativePath = String(input.path).replace(/^[/\\]+/, '');
    const fullPath = path.resolve(this.basePath, relativePath);
    const baseWithSep = this.basePath.endsWith(path.sep)
      ? this.basePath
      : `${this.basePath}${path.sep}`;

    if (!fullPath.startsWith(baseWithSep)) {
      throw AppError.validation('Caminho de upload inválido');
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.buffer);

    const urlPath = relativePath.replace(/[\\]+/g, '/');
    const publicBaseUrl = env.UPLOAD_BASE_URL?.replace(/\/+$/g, '');
    const url = publicBaseUrl
      ? `${publicBaseUrl}/${urlPath}`
      : `/uploads/${urlPath}`;

    return {
      path: relativePath,
      size: input.size,
      url,
      mimeType: input.mimeType,
      filename: path.basename(relativePath),
    };
  }

  async delete(filePath: string): Promise<void> {
    const relativePath = String(filePath).replace(/^[/\\]+/, '');
    const fullPath = path.resolve(this.basePath, relativePath);
    const baseWithSep = this.basePath.endsWith(path.sep)
      ? this.basePath
      : `${this.basePath}${path.sep}`;

    if (!fullPath.startsWith(baseWithSep)) {
      throw AppError.validation('Caminho de upload inválido');
    }

    try {
      await fs.unlink(fullPath);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}
