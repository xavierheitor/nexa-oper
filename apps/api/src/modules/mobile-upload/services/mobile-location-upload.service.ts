/**
 * Serviço responsável por processar uploads de localização enviados pelo aplicativo mobile.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { createHash } from 'crypto';
import {
  LocationUploadDto,
  LocationUploadResponseDto,
} from '../dto';
import {
  createAuditData,
  getDefaultUserContext,
} from '@common/utils/audit';

/**
 * Serviço de upload de localizações mobile.
 */
@Injectable()
export class MobileLocationUploadService {
  private readonly logger = new Logger(MobileLocationUploadService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Registra uma localização enviada pelo aplicativo mobile garantindo idempotência.
   */
  async handleUpload(
    payload: LocationUploadDto
  ): Promise<LocationUploadResponseDto> {
    const signature = this.buildSignature(payload);
    const audit = createAuditData(getDefaultUserContext());

    const prisma = this.db.getPrisma();

    try {
      // Tentar inserir diretamente - se já existir, será capturado pelo catch
      await prisma.mobileLocation.create({
        data: {
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
          ...audit,
        },
      });

      this.logger.log(
        `Localização armazenada com sucesso para turno ${payload.turnoId}`
      );

      return {
        status: 'ok',
        alreadyExisted: false,
      };
    } catch (error) {
      // Se for erro de constraint única, significa que já existe
      if (error.code === 'P2002' && error.meta?.target?.includes('signature')) {
        this.logger.debug(
          `Localização duplicada detectada (signature=${signature}), ignorando nova inserção`
        );

        return {
          status: 'ok',
          alreadyExisted: true,
        };
      }

      // Se for outro erro, relançar
      throw error;
    }
  }

  /**
   * Gera uma assinatura determinística para garantir idempotência.
   */
  private buildSignature(payload: LocationUploadDto): string {
    const components = [
      payload.turnoId,
      payload.veiculoRemoteId ?? 'null',
      payload.equipeRemoteId ?? 'null',
      payload.latitude,
      payload.longitude,
      payload.accuracy ?? 'null',
      payload.provider ?? 'null',
      payload.tagType ?? 'null',
      payload.capturedAt ?? 'null',
    ];

    return createHash('sha256').update(components.join('|')).digest('hex');
  }
}
