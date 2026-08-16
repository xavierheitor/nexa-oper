import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as path from 'node:path';
import type {
  InspecaoSegurancaUploadPhotoContract,
  InspecaoSegurancaUploadRequestContract,
  InspecaoSegurancaUploadResponseContract,
  InspecaoSegurancaUploadRespostaContract,
} from '../../contracts/inspecao-seguranca-upload/inspecao-seguranca-upload.contract';
import { AppError } from '../../core/errors/app-error';
import { AppLogger } from '../../core/logger/app-logger';
import { PrismaService } from '../../database/prisma.service';
import type { StorageAdapter } from '../upload/storage/storage.adapter';
import { normalizeStoredUploadResult } from '../upload/storage/upload-url';

export const INSPECAO_SEGURANCA_UPLOAD_STORAGE =
  'INSPECAO_SEGURANCA_UPLOAD_STORAGE';

interface StoredEvidence {
  path: string;
  url: string;
  size: number;
  mimeType: string;
  checksum: string;
  tipo: 'PROBLEMA' | 'TRATAMENTO';
}

@Injectable()
export class InspecaoSegurancaUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    @Inject(INSPECAO_SEGURANCA_UPLOAD_STORAGE)
    private readonly storage: StorageAdapter,
  ) {}

  async upload(
    payload: InspecaoSegurancaUploadRequestContract,
    userId?: number,
  ): Promise<InspecaoSegurancaUploadResponseContract> {
    this.validatePayload(payload);

    const existing = await this.prisma.inspecaoSegurancaPreenchida.findUnique({
      where: { uuid: payload.inspecaoUuid },
      select: { id: true },
    });

    if (existing) {
      const [respostasSalvas, pendenciasGeradas, evidenciasSalvas] =
        await Promise.all([
          this.prisma.inspecaoSegurancaResposta.count({
            where: { inspecaoPreenchidaId: existing.id, deletedAt: null },
          }),
          this.prisma.inspecaoSegurancaPendencia.count({
            where: { inspecaoPreenchidaId: existing.id, deletedAt: null },
          }),
          this.prisma.inspecaoSegurancaEvidencia.count({
            where: {
              OR: [
                { resposta: { inspecaoPreenchidaId: existing.id } },
                { pendencia: { inspecaoPreenchidaId: existing.id } },
              ],
              deletedAt: null,
            },
          }),
        ]);

      return {
        id: existing.id,
        inspecaoUuid: payload.inspecaoUuid,
        alreadyExisted: true,
        respostasSalvas,
        pendenciasGeradas,
        evidenciasSalvas,
      };
    }

    const turno = await this.prisma.turno.findUnique({
      where: { id: payload.turnoId, deletedAt: null },
      select: { id: true },
    });

    if (!turno) {
      throw AppError.validation(
        `Turno ${payload.turnoId} não encontrado para upload de inspeção`,
      );
    }

    const createdBy = userId != null ? String(userId) : 'mobile';
    const evidenciasPorResposta = await this.storeEvidences(payload);

    const result = await this.prisma.$transaction(async (tx) => {
      const inspecao = await tx.inspecaoSegurancaPreenchida.create({
        data: {
          uuid: payload.inspecaoUuid,
          turnoId: payload.turnoId,
          modeloId: payload.modeloId ?? null,
          tipoId: payload.tipoId ?? null,
          modeloNomeSnapshot: normalizeRequired(payload.modeloNomeSnapshot),
          tipoNomeSnapshot: normalizeRequired(payload.tipoNomeSnapshot),
          tipoChaveSnapshot: normalizeRequired(payload.tipoChaveSnapshot),
          contextoSnapshot: payload.contextoSnapshot,
          inspetorMobileUserId: userId ?? null,
          inspetorNomeSnapshot: normalizeOptional(payload.inspetorNomeSnapshot),
          colaboradorNomeSnapshot: normalizeOptional(
            payload.colaboradorNomeSnapshot,
          ),
          epcNomeSnapshot: normalizeOptional(payload.epcNomeSnapshot),
          placaVeiculoSnapshot: normalizeOptional(payload.placaVeiculoSnapshot),
          veiculoId: payload.veiculoId ?? null,
          observacoes: normalizeOptional(payload.observacoes),
          realizadaEm: parseDate(payload.realizadaEm) ?? new Date(),
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          createdBy,
        },
      });

      let pendenciasGeradas = 0;
      let evidenciasSalvas = 0;

      for (const [index, respostaPayload] of payload.respostas.entries()) {
        const resposta = await tx.inspecaoSegurancaResposta.create({
          data: {
            inspecaoPreenchidaId: inspecao.id,
            grupoPerguntaId: respostaPayload.grupoPerguntaId ?? null,
            perguntaId: respostaPayload.perguntaId ?? null,
            opcaoRespostaId: respostaPayload.opcaoRespostaId ?? null,
            grupoNomeSnapshot: normalizeOptional(
              respostaPayload.grupoNomeSnapshot,
            ),
            perguntaNomeSnapshot: normalizeRequired(
              respostaPayload.perguntaNomeSnapshot,
            ),
            tipoRespostaSnapshot: normalizeRequired(
              respostaPayload.tipoRespostaSnapshot,
            ),
            opcaoNomeSnapshot: normalizeOptional(
              respostaPayload.opcaoRespostaNomeSnapshot,
            ),
            respostaTexto: normalizeOptional(respostaPayload.respostaTexto),
            marcado: respostaPayload.marcado ?? null,
            ordemGrupo: respostaPayload.ordemGrupo ?? 0,
            ordemPergunta: respostaPayload.ordemPergunta ?? index,
            dataResposta:
              parseDate(respostaPayload.dataResposta) ??
              parseDate(payload.realizadaEm) ??
              new Date(),
            aguardandoFoto:
              Boolean(respostaPayload.geraPendenciaSnapshot) &&
              Boolean(respostaPayload.exigeFotoSnapshot) &&
              !respostaPayload.fotos?.length,
            fotosSincronizadas: respostaPayload.fotos?.length ?? 0,
            createdBy,
          },
        });

        let pendenciaId: number | null = null;
        if (respostaPayload.geraPendenciaSnapshot) {
          const pendencia = await tx.inspecaoSegurancaPendencia.create({
            data: {
              respostaId: resposta.id,
              inspecaoPreenchidaId: inspecao.id,
              turnoId: payload.turnoId,
              status: respostaPayload.sanadaEmCampo
                ? 'SANADA_EM_CAMPO'
                : 'AGUARDANDO_TRATAMENTO',
              sanadaEmCampo: Boolean(respostaPayload.sanadaEmCampo),
              observacaoProblema: normalizeOptional(
                respostaPayload.observacaoProblema,
              ),
              observacaoTratamento: normalizeOptional(
                respostaPayload.observacaoTratamento,
              ),
              tratadoPor: respostaPayload.sanadaEmCampo ? createdBy : null,
              tratadoEm: respostaPayload.sanadaEmCampo ? new Date() : null,
              createdBy,
            },
          });
          pendenciasGeradas += 1;
          pendenciaId = pendencia.id;
        }

        const evidencias = evidenciasPorResposta.get(index) ?? [];
        for (const evidencia of evidencias) {
          await tx.inspecaoSegurancaEvidencia.create({
            data: {
              respostaId: resposta.id,
              pendenciaId,
              tipo: evidencia.tipo,
              caminhoArquivo: evidencia.path,
              urlPublica: evidencia.url,
              tamanhoBytes: evidencia.size,
              mimeType: evidencia.mimeType,
              checksum: evidencia.checksum,
              sincronizadoEm: new Date(),
              createdBy,
            },
          });
          evidenciasSalvas += 1;
        }
      }

      return {
        id: inspecao.id,
        respostasSalvas: payload.respostas.length,
        pendenciasGeradas,
        evidenciasSalvas,
      };
    });

    this.logger.info('Upload de inspeção de segurança salvo', {
      inspecaoUuid: payload.inspecaoUuid,
      turnoId: payload.turnoId,
      respostasSalvas: result.respostasSalvas,
      pendenciasGeradas: result.pendenciasGeradas,
      evidenciasSalvas: result.evidenciasSalvas,
    });

    return {
      id: result.id,
      inspecaoUuid: payload.inspecaoUuid,
      alreadyExisted: false,
      respostasSalvas: result.respostasSalvas,
      pendenciasGeradas: result.pendenciasGeradas,
      evidenciasSalvas: result.evidenciasSalvas,
    };
  }

  private validatePayload(payload: InspecaoSegurancaUploadRequestContract): void {
    if (!payload.respostas?.length) {
      throw AppError.validation('Inspeção deve conter ao menos uma resposta');
    }

    for (const [index, resposta] of payload.respostas.entries()) {
      if (!normalizeOptional(resposta.perguntaNomeSnapshot)) {
        throw AppError.validation(
          `Resposta ${index + 1} sem snapshot do nome da pergunta`,
        );
      }

      if (resposta.sanadaEmCampo && !resposta.geraPendenciaSnapshot) {
        throw AppError.validation(
          `Resposta ${index + 1} marcada como sanada sem gerar pendência`,
        );
      }
    }
  }

  private async storeEvidences(
    payload: InspecaoSegurancaUploadRequestContract,
  ): Promise<Map<number, StoredEvidence[]>> {
    const result = new Map<number, StoredEvidence[]>();

    for (const [index, resposta] of payload.respostas.entries()) {
      const fotos = resposta.fotos ?? [];
      if (!fotos.length) continue;

      const stored: StoredEvidence[] = [];
      for (const [photoIndex, photo] of fotos.entries()) {
        stored.push(
          await this.storeEvidence(payload.inspecaoUuid, index, photoIndex, photo),
        );
      }
      result.set(index, stored);
    }

    return result;
  }

  private async storeEvidence(
    inspecaoUuid: string,
    respostaIndex: number,
    photoIndex: number,
    photo: InspecaoSegurancaUploadPhotoContract,
  ): Promise<StoredEvidence> {
    const { buffer, mimeType } = decodeBase64Photo(photo);
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const ext = extensionFromMimeOrName(mimeType, photo.fileName);
    const safeRef = sanitizePathPart(photo.ref ?? `resposta-${respostaIndex + 1}`);
    const tipo = photo.tipo ?? 'PROBLEMA';
    const storagePath = path.posix.join(
      'inspecoes-seguranca',
      inspecaoUuid,
      `${safeRef}-${tipo.toLowerCase()}-${photoIndex + 1}-${checksum.slice(
        0,
        12,
      )}${ext}`,
    );

    const uploaded = normalizeStoredUploadResult(
      await this.storage.upload({
        buffer,
        mimeType,
        size: buffer.length,
        path: storagePath,
      }),
    );

    return {
      path: uploaded.path,
      url: uploaded.url,
      size: uploaded.size,
      mimeType: uploaded.mimeType ?? mimeType,
      checksum,
      tipo,
    };
  }
}

function normalizeOptional(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function normalizeRequired(value: unknown): string {
  const normalized = normalizeOptional(value);
  if (!normalized) {
    throw AppError.validation('Campo obrigatório vazio no upload de inspeção');
  }
  return normalized;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function decodeBase64Photo(photo: InspecaoSegurancaUploadPhotoContract): {
  buffer: Buffer;
  mimeType: string;
} {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(photo.base64);
  const mimeType = photo.mimeType ?? match?.[1] ?? 'image/jpeg';
  const raw = match?.[2] ?? photo.base64;
  const buffer = Buffer.from(raw, 'base64');

  if (buffer.length === 0) {
    throw AppError.validation('Foto de inspeção inválida');
  }

  return { buffer, mimeType };
}

function extensionFromMimeOrName(mimeType: string, fileName?: string): string {
  const nameExt = fileName ? path.extname(fileName) : '';
  if (nameExt) return nameExt.toLowerCase();
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('webp')) return '.webp';
  return '.jpg';
}

function sanitizePathPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);
}
