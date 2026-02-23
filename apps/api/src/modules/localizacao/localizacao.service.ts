import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateLocationRecordPort,
  LocationTurnoSnapshotPort,
  LocationUploadRepositoryPort,
} from './domain/ports/location-upload-repository.port';

/**
 * Adaptador de persistência para o módulo de localização.
 * Encapsula consultas/escritas Prisma usadas pelo caso de uso.
 */
@Injectable()
export class LocalizacaoService implements LocationUploadRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findTurnoById(turnoId: number): Promise<LocationTurnoSnapshotPort | null> {
    return this.prisma.turno.findUnique({
      where: { id: turnoId },
      select: { id: true, dataFim: true },
    });
  }

  async createLocation(data: CreateLocationRecordPort): Promise<void> {
    await this.prisma.mobileLocation.create({
      data: {
        turnoId: data.turnoId,
        veiculoRemoteId: data.veiculoRemoteId,
        equipeRemoteId: data.equipeRemoteId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        provider: data.provider,
        batteryLevel: data.batteryLevel,
        tagType: data.tagType,
        tagDetail: data.tagDetail,
        capturedAt: data.capturedAt,
        signature: data.signature,
        createdBy: data.createdBy,
      },
    });
  }
}
