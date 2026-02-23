import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  LocationUploadRequestContract,
  LocationUploadResponseContract,
} from '../../../../contracts/localizacao/location-upload.contract';
import { AppLogger } from '../../../../core/logger/app-logger';
import {
  LOCATION_UPLOAD_REPOSITORY,
  type LocationUploadRepositoryPort,
} from '../../domain/ports/location-upload-repository.port';

@Injectable()
export class UploadLocationUseCase {
  constructor(
    @Inject(LOCATION_UPLOAD_REPOSITORY)
    private readonly repository: LocationUploadRepositoryPort,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    payload: LocationUploadRequestContract,
    userId?: number,
  ): Promise<LocationUploadResponseContract> {
    const signature = this.buildSignature(payload);

    try {
      const turno = await this.repository.findTurnoById(payload.turnoId);

      if (!turno) {
        this.logger.warn(
          'Tentativa de salvar localização para turno inexistente',
          {
            turnoId: payload.turnoId,
          },
        );
        return { status: 'ok', alreadyExisted: false };
      }

      if (turno.dataFim) {
        this.logger.debug('Salvando localização para turno já fechado', {
          turnoId: payload.turnoId,
        });
      }

      await this.repository.createLocation({
        turnoId: payload.turnoId,
        veiculoRemoteId: payload.veiculoRemoteId ?? null,
        equipeRemoteId: payload.equipeRemoteId ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy ?? null,
        provider: payload.provider ?? null,
        batteryLevel: payload.batteryLevel ?? null,
        tagType: payload.tagType ?? null,
        tagDetail: payload.tagDetail ?? null,
        capturedAt: payload.capturedAt
          ? new Date(payload.capturedAt)
          : new Date(),
        signature,
        createdBy: userId != null ? String(userId) : 'system',
      });

      this.logger.info('Localização armazenada com sucesso', {
        turnoId: payload.turnoId,
      });

      return { status: 'ok', alreadyExisted: false };
    } catch (error: unknown) {
      return this.handleUploadError(error, signature, payload.turnoId);
    }
  }

  private handleUploadError(
    error: unknown,
    signature: string,
    turnoId: number,
  ): LocationUploadResponseContract {
    const knownError = this.extractKnownPrismaError(error);

    if (this.isDuplicateSignatureError(knownError)) {
      this.logger.debug(
        'Localização duplicada detectada (signature), ignorando.',
        { signature },
      );
      return { status: 'ok', alreadyExisted: true };
    }

    if (knownError?.code === 'P2003' || knownError?.code === 'P2025') {
      this.logger.warn(
        'Erro ao salvar localização - Turno não encontrado ou inválido',
        {
          turnoId,
          errMessage: knownError?.message,
        },
      );
      return { status: 'ok', alreadyExisted: false };
    }

    this.logger.error('Erro ao salvar localização', error, { turnoId });
    throw error;
  }

  private extractKnownPrismaError(error: unknown): {
    code?: string;
    meta?: Record<string, unknown>;
    message?: string;
  } | null {
    if (!error || typeof error !== 'object') return null;

    const raw = error as Record<string, unknown>;
    const code = typeof raw.code === 'string' ? raw.code : undefined;
    const message = typeof raw.message === 'string' ? raw.message : undefined;
    const meta =
      raw.meta && typeof raw.meta === 'object'
        ? (raw.meta as Record<string, unknown>)
        : undefined;

    return { code, meta, message };
  }

  private isDuplicateSignatureError(
    error: {
      code?: string;
      meta?: Record<string, unknown>;
      message?: string;
    } | null,
  ): boolean {
    if (error?.code !== 'P2002') return false;

    return (
      this.containsSignatureHint(error.meta?.target) ||
      this.containsSignatureHint(error.meta?.constraint) ||
      this.containsSignatureHint(error.message)
    );
  }

  private containsSignatureHint(value: unknown): boolean {
    if (typeof value === 'string') {
      return value.toLowerCase().includes('signature');
    }

    if (Array.isArray(value)) {
      return value.some((item) => this.containsSignatureHint(item));
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((item) =>
        this.containsSignatureHint(item),
      );
    }

    return false;
  }

  private buildSignature(payload: LocationUploadRequestContract): string {
    const components = [
      payload.turnoId,
      payload.veiculoRemoteId ?? 'null',
      payload.equipeRemoteId ?? 'null',
      payload.latitude,
      payload.longitude,
      payload.accuracy ?? 'null',
      payload.provider ?? 'null',
      payload.tagType ?? 'null',
      payload.tagDetail ?? 'null',
      payload.capturedAt ?? 'null',
    ];

    return createHash('sha256').update(components.join('|')).digest('hex');
  }
}
