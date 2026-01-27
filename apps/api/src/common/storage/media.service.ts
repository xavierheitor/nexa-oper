/**
 * Serviço centralizado para operações de mídia (fotos, arquivos).
 *
 * Abstrai operações comuns de armazenamento de mídia, fornecendo
 * uma interface simplificada para salvar, deletar e gerar URLs públicas.
 */

import { Inject, Injectable } from '@nestjs/common';
import { join } from 'path';

import { STORAGE_PORT, type StoragePort } from './storage.port';

export interface SaveBufferResult {
  key: string;
  absolutePath: string;
  publicUrl: string;
}

@Injectable()
export class MediaService {
  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  /**
   * Salva um buffer no storage e retorna informações sobre o arquivo salvo.
   *
   * @param params - Parâmetros para salvar o buffer
   * @param params.key - Chave relativa do arquivo (ex: "10/123/file.jpg")
   * @param params.buffer - Buffer do arquivo
   * @param params.contentType - Tipo MIME do arquivo
   * @param params.rootPath - Caminho raiz absoluto onde o arquivo será armazenado
   * @returns Informações sobre o arquivo salvo (key, absolutePath, publicUrl)
   */
  async saveBuffer(params: {
    key: string;
    buffer: Buffer;
    contentType?: string;
    rootPath: string;
  }): Promise<SaveBufferResult> {
    const { key, buffer, contentType, rootPath } = params;

    await this.storage.put({
      key,
      buffer,
      contentType,
    });

    const absolutePath = join(rootPath, ...key.split('/').filter(Boolean));
    const publicUrl = this.storage.getPublicUrl(key);

    return {
      key,
      absolutePath,
      publicUrl,
    };
  }

  /**
   * Deleta um arquivo do storage pela sua chave.
   *
   * @param key - Chave relativa do arquivo a ser deletado
   */
  async deleteByKey(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  /**
   * Gera a URL pública para um arquivo pela sua chave.
   *
   * @param key - Chave relativa do arquivo
   * @returns URL pública do arquivo
   */
  getPublicUrl(key: string): string {
    return this.storage.getPublicUrl(key);
  }
}
