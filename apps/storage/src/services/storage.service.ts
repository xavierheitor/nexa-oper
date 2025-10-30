import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { PrismaService } from './prisma.service';
import { config } from '../config/env';

export class StorageService {
  private prisma = new PrismaService();

  async handleUpload(file: Express.Multer.File, metadata: any) {
    // Calcular checksum
    const checksum = this.computeChecksum(file.buffer);

    // Verificar duplicidade
    const existing = await this.prisma.client.photo.findUnique({
      where: { checksum },
    });

    if (existing) {
      return {
        status: 'duplicate',
        url: existing.url,
        checksum: existing.checksum,
      };
    }

    // Gerar caminho e salvar arquivo
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${this.getExtension(file)}`;
    const relativePath = `mobile/photos/${metadata.turnoId}/${fileName}`;
    const absolutePath = join(config.uploadDir, relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const url = `/photos/${relativePath}`;

    // Salvar no banco
    const photo = await this.prisma.client.photo.create({
      data: {
        turnoId: parseInt(metadata.turnoId),
        tipo: metadata.tipo,
        checklistUuid: metadata.checklistUuid || null,
        checklistPerguntaId: metadata.checklistPerguntaId ? parseInt(metadata.checklistPerguntaId) : null,
        sequenciaAssinatura: metadata.sequenciaAssinatura ? parseInt(metadata.sequenciaAssinatura) : null,
        servicoId: metadata.servicoId ? parseInt(metadata.servicoId) : null,
        fileName,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        storagePath: absolutePath,
        url,
        capturedAt: new Date(),
        createdAt: new Date(),
        createdBy: 'storage-service',
      },
    });

    return {
      status: 'stored',
      url,
      checksum,
    };
  }

  private computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private getExtension(file: Express.Multer.File): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return mimeMap[file.mimetype] || 'bin';
  }
}

