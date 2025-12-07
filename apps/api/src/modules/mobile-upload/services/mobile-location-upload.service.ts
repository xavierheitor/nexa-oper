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
      // Validar se o turno existe e não está fechado
      if (payload.turnoId) {
        const turno = await prisma.turno.findUnique({
          where: { id: payload.turnoId },
          select: { id: true, dataFim: true },
        });

        if (!turno) {
          this.logger.warn(
            `Tentativa de salvar localização para turno inexistente - Turno ID: ${payload.turnoId}`
          );
          return {
            status: 'ok',
            alreadyExisted: false,
          };
        }

        // Permitir salvar localizações mesmo para turnos fechados (pode ser localização de fechamento)
        // Mas logar para monitoramento
        if (turno.dataFim) {
          this.logger.debug(
            `Salvando localização para turno já fechado - Turno ID: ${payload.turnoId}`
          );
        }
      }

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
    } catch (error: any) {
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

      // Se for erro de foreign key (turno não existe), logar e retornar ok
      if (error.code === 'P2003' || error.code === 'P2025') {
        this.logger.warn(
          `Erro ao salvar localização - Turno não encontrado ou inválido - Turno ID: ${payload.turnoId}, Erro: ${error.message}`
        );

        return {
          status: 'ok',
          alreadyExisted: false,
        };
      }

      // Se for outro erro, logar e relançar
      this.logger.error(
        `Erro ao salvar localização para turno ${payload.turnoId}:`,
        error
      );
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
