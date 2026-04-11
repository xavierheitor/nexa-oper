import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { StorageAdapter } from '../upload/storage/storage.adapter';
import { AppError } from '../../core/errors/app-error';
import { CreateMobileAppVersionDto } from './dto/mobile-app-version.dto';
import * as path from 'node:path';

@Injectable()
export class MobileAppVersionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('STORAGE_ADAPTER') private readonly storage: StorageAdapter,
  ) {}

  private sanitizeFilename(filename: string): string {
    const base = path.basename(filename);
    const ascii = base.replace(/[^\x20-\x7E]/g, '');
    const clean = ascii
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\.+/, '');
    return clean.slice(0, 120) || 'file.apk';
  }

  async create(
    dto: CreateMobileAppVersionDto,
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    if (!file || !file.buffer) {
      throw AppError.validation('Arquivo APK é obrigatório.');
    }

    const safeFilename = this.sanitizeFilename(file.originalname);
    const storagePath = `apk/${Date.now()}-${safeFilename}`;

    // Faz upload pro storage (Bucket S3 ou Local)
    const uploadResult = await this.storage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      size: file.size,
      path: storagePath,
    });

    const isAtivo = dto.ativo === true;

    return this.prisma.$transaction(async (tx) => {
      // Se definido como ativo, desativa os demais da mesma plataforma
      if (isAtivo) {
        await tx.mobileAppVersion.updateMany({
          where: { plataforma: dto.plataforma ?? 'android' },
          data: { ativo: false },
        });
      }

      return tx.mobileAppVersion.create({
        data: {
          versao: dto.versao,
          plataforma: dto.plataforma ?? 'android',
          notas: dto.notas,
          arquivoUrl: uploadResult.url,
          ativo: isAtivo,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.mobileAppVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: number) {
    const version = await this.prisma.mobileAppVersion.findUnique({
      where: { id },
    });
    if (!version) return;

    await this.prisma.mobileAppVersion.delete({ where: { id } });

    // // Tentar apagar do storage
    // try {
    //   // url pode ser full URL. O ideal seria salvar o path, mas como guardamos a URL,
    //   // podemos ter de fazer parsing dependendo da implementacao do storage.
    //   // Caso Local, armazenamos a URL /uploads/...
    // } catch (e) {
    //   // Ignora erro de remocao do storage
    // }
  }

  async activate(id: number) {
    const version = await this.prisma.mobileAppVersion.findUnique({
      where: { id },
    });
    if (!version) {
      throw AppError.notFound('Versão não encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.mobileAppVersion.updateMany({
        where: { plataforma: version.plataforma },
        data: { ativo: false },
      });

      return tx.mobileAppVersion.update({
        where: { id },
        data: { ativo: true },
      });
    });
  }

  async getLatestReleaseUrl(plataforma: string): Promise<string> {
    const version = await this.prisma.mobileAppVersion.findFirst({
      where: { plataforma, ativo: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!version) {
      throw AppError.notFound(
        `Nenhuma versão ativa encontrada para a plataforma: ${plataforma}`,
      );
    }

    return version.arquivoUrl;
  }
}
