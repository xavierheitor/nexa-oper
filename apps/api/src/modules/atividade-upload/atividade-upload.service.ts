import { createHash } from 'crypto';
import type { Prisma } from '@nexa-oper/db';
import { Inject, Injectable } from '@nestjs/common';
import * as path from 'node:path';
import type {
  AtividadeUploadAprContract,
  AtividadeUploadPhotoContract,
  AtividadeUploadRequestContract,
  AtividadeUploadResponseContract,
} from '../../contracts/atividade-upload/atividade-upload.contract';
import { AppError } from '../../core/errors/app-error';
import { env } from '../../core/config/env';
import { AppLogger } from '../../core/logger/app-logger';
import { PrismaService } from '../../database/prisma.service';
import type { StorageAdapter } from '../upload/storage/storage.adapter';
import {
  type AtividadeTurnoSnapshotPort,
  type AtividadeUploadRepositoryPort,
} from './domain/ports/atividade-upload-repository.port';

const ATIVIDADE_UPLOAD_STORAGE = 'ATIVIDADE_UPLOAD_STORAGE';

interface CollectedPhoto {
  ref: string;
  contexto: string | null;
  photo: AtividadeUploadPhotoContract;
}

interface StoredPhotoRecord {
  id: number;
  path: string;
}

interface TurnoEletricistaSnapshot {
  id: number;
  eletricistaId: number;
  eletricista: {
    nome: string;
    matricula: string;
  };
}

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename);
  const ascii = base.replace(/[^\x20-\x7E]/g, '');
  const clean = ascii
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '');
  const trimmed = clean.slice(0, 120);
  return trimmed || 'foto';
}

function normalizeString(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseDateOrNull(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function inferMimeTypeFromDataUrl(base64: string): string | null {
  const match = /^data:([^;,]+);base64,/i.exec(base64);
  return match?.[1] ?? null;
}

function stripDataUrlPrefix(base64: string): string {
  return base64.replace(/^data:[^;,]+;base64,/i, '').trim();
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'bin';
  }
}

function storagePathForPhoto(
  atividadeUuid: string,
  index: number,
  fileName: string,
): string {
  return `atividades/${atividadeUuid}/fotos/${Date.now()}-${index}-${fileName}`;
}

@Injectable()
export class AtividadeUploadService implements AtividadeUploadRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ATIVIDADE_UPLOAD_STORAGE)
    private readonly storage: StorageAdapter,
    private readonly logger: AppLogger,
  ) {}

  findTurnoById(turnoId: number): Promise<AtividadeTurnoSnapshotPort | null> {
    return this.prisma.turno.findUnique({
      where: { id: turnoId },
      select: { id: true },
    });
  }

  async persistUpload(
    payload: AtividadeUploadRequestContract,
    userId?: number,
  ): Promise<AtividadeUploadResponseContract> {
    const createdBy = userId != null ? String(userId) : 'system';
    const now = new Date();

    const existing = await this.prisma.atividadeExecucao.findUnique({
      where: { atividadeUuid: payload.atividadeUuid },
      select: { id: true },
    });

    const execucao = await this.prisma.atividadeExecucao.upsert({
      where: { atividadeUuid: payload.atividadeUuid },
      create: {
        atividadeUuid: payload.atividadeUuid,
        remoteId: payload.atividadeRemoteId ?? null,
        turnoId: payload.turnoId,
        tipoAtividadeId: payload.tipoAtividadeRemoteId ?? null,
        tipoAtividadeServicoId: payload.tipoServicoRemoteId ?? null,
        atividadeFormTemplateId: payload.atividadeFormTemplateId ?? null,
        tipoAtividadeNomeSnapshot: normalizeString(payload.tipoAtividadeNome),
        tipoServicoNomeSnapshot: normalizeString(payload.tipoServicoNome),
        tipoLigacao: normalizeString(payload.tipoLigacao),
        numeroDocumento: normalizeString(payload.numeroDocumento),
        aplicaMedidor: payload.aplicaMedidor ?? false,
        aplicaRamal: payload.aplicaRamal ?? false,
        aplicaMaterial: payload.aplicaMaterial ?? false,
        statusFluxo: normalizeString(payload.statusFluxo) ?? 'em_execucao',
        etapaAtual: normalizeString(payload.etapaAtual) ?? 'identificacao',
        aprPreenchidaEm: parseDateOrNull(payload.aprPreenchidaEm),
        finalizadaEm: parseDateOrNull(payload.finalizadaEm),
        observacoesFinalizacao: normalizeString(payload.observacoesFinalizacao),
        syncStatus: 'received',
        attemptCount: 0,
        syncError: null,
        lastAttemptAt: null,
        createdAt: parseDateOrNull(payload.dataCriacao) ?? now,
        updatedAt: parseDateOrNull(payload.dataModificacao) ?? now,
        createdBy,
      },
      update: {
        remoteId: payload.atividadeRemoteId ?? null,
        turnoId: payload.turnoId,
        tipoAtividadeId: payload.tipoAtividadeRemoteId ?? null,
        tipoAtividadeServicoId: payload.tipoServicoRemoteId ?? null,
        atividadeFormTemplateId: payload.atividadeFormTemplateId ?? null,
        tipoAtividadeNomeSnapshot: normalizeString(payload.tipoAtividadeNome),
        tipoServicoNomeSnapshot: normalizeString(payload.tipoServicoNome),
        tipoLigacao: normalizeString(payload.tipoLigacao),
        numeroDocumento: normalizeString(payload.numeroDocumento),
        aplicaMedidor: payload.aplicaMedidor ?? false,
        aplicaRamal: payload.aplicaRamal ?? false,
        aplicaMaterial: payload.aplicaMaterial ?? false,
        statusFluxo: normalizeString(payload.statusFluxo) ?? 'em_execucao',
        etapaAtual: normalizeString(payload.etapaAtual) ?? 'identificacao',
        aprPreenchidaEm: parseDateOrNull(payload.aprPreenchidaEm),
        finalizadaEm: parseDateOrNull(payload.finalizadaEm),
        observacoesFinalizacao: normalizeString(payload.observacoesFinalizacao),
        syncStatus: 'received',
        attemptCount: 0,
        syncError: null,
        lastAttemptAt: null,
        updatedBy: createdBy,
        updatedAt: parseDateOrNull(payload.dataModificacao) ?? now,
      },
      select: { id: true, atividadeUuid: true },
    });

    const createdPhotos: StoredPhotoRecord[] = [];
    let photoRefMap = new Map<string, number>();
    try {
      photoRefMap = await this.persistPhotosForActivity(
        execucao.id,
        execucao.atividadeUuid,
        payload,
        createdBy,
        createdPhotos,
      );

      await this.prisma.$transaction(async (tx) => {
        await this.persistMedidor(
          tx,
          execucao.id,
          payload,
          photoRefMap,
          createdBy,
        );
        await this.persistMateriais(tx, execucao.id, payload, createdBy);
        await this.persistRespostas(
          tx,
          execucao.id,
          payload,
          photoRefMap,
          createdBy,
        );
        await this.persistEventos(tx, execucao.id, payload, createdBy);
        await this.persistAprs(
          tx as PrismaService,
          execucao.id,
          payload,
          createdBy,
        );
      });
    } catch (error: unknown) {
      await this.cleanupCreatedPhotos(createdPhotos);
      throw error;
    }

    this.logger.info('Upload de atividade processado', {
      atividadeExecucaoId: execucao.id,
      atividadeUuid: execucao.atividadeUuid,
      alreadyExisted: existing != null,
      savedPhotos: photoRefMap.size,
    });

    return {
      status: 'ok',
      atividadeExecucaoId: execucao.id,
      atividadeUuid: execucao.atividadeUuid,
      alreadyExisted: existing != null,
      savedPhotos: photoRefMap.size,
    };
  }

  private async persistMedidor(
    tx: Prisma.TransactionClient,
    atividadeExecucaoId: number,
    payload: AtividadeUploadRequestContract,
    photoRefMap: Map<string, number>,
    createdBy: string,
  ) {
    if (!payload.medidor) {
      await tx.atividadeMedidor.deleteMany({ where: { atividadeExecucaoId } });
      return;
    }

    const instaladoFotoId = this.resolvePhotoRef(
      payload.medidor.instaladoPhotoRef,
      photoRefMap,
      'medidor.instaladoPhotoRef',
    );
    const retiradoFotoId = this.resolvePhotoRef(
      payload.medidor.retiradoPhotoRef,
      photoRefMap,
      'medidor.retiradoPhotoRef',
    );

    await tx.atividadeMedidor.upsert({
      where: { atividadeExecucaoId },
      create: {
        atividadeExecucaoId,
        somenteRetirada: payload.medidor.somenteRetirada ?? false,
        instaladoNumero: normalizeString(payload.medidor.instaladoNumero),
        instaladoFotoId,
        instaladoFotoExternalId:
          instaladoFotoId != null
            ? null
            : (payload.medidor.instaladoPhotoId ?? null),
        retiradoStatus: normalizeString(payload.medidor.retiradoStatus),
        retiradoNumero: normalizeString(payload.medidor.retiradoNumero),
        retiradoLeitura: normalizeString(payload.medidor.retiradoLeitura),
        retiradoFotoId,
        retiradoFotoExternalId:
          retiradoFotoId != null
            ? null
            : (payload.medidor.retiradoPhotoId ?? null),
        createdBy,
      },
      update: {
        somenteRetirada: payload.medidor.somenteRetirada ?? false,
        instaladoNumero: normalizeString(payload.medidor.instaladoNumero),
        instaladoFotoId,
        instaladoFotoExternalId:
          instaladoFotoId != null
            ? null
            : (payload.medidor.instaladoPhotoId ?? null),
        retiradoStatus: normalizeString(payload.medidor.retiradoStatus),
        retiradoNumero: normalizeString(payload.medidor.retiradoNumero),
        retiradoLeitura: normalizeString(payload.medidor.retiradoLeitura),
        retiradoFotoId,
        retiradoFotoExternalId:
          retiradoFotoId != null
            ? null
            : (payload.medidor.retiradoPhotoId ?? null),
        updatedBy: createdBy,
      },
    });
  }

  private async persistMateriais(
    tx: Prisma.TransactionClient,
    atividadeExecucaoId: number,
    payload: AtividadeUploadRequestContract,
    createdBy: string,
  ) {
    await tx.atividadeMaterialAplicado.deleteMany({
      where: { atividadeExecucaoId },
    });

    if (!payload.materiais?.length) return;

    await tx.atividadeMaterialAplicado.createMany({
      data: payload.materiais.map((m) => ({
        atividadeExecucaoId,
        materialCatalogoId: m.materialCatalogoRemoteId ?? null,
        materialCatalogoRemoteId: m.materialCatalogoRemoteId ?? null,
        materialCodigoSnapshot: m.materialCodigo,
        materialDescricaoSnapshot: m.materialDescricao,
        unidadeMedidaSnapshot: m.unidadeMedida,
        quantidade: m.quantidade,
        createdBy,
      })),
    });
  }

  private async persistRespostas(
    tx: Prisma.TransactionClient,
    atividadeExecucaoId: number,
    payload: AtividadeUploadRequestContract,
    photoRefMap: Map<string, number>,
    createdBy: string,
  ) {
    await tx.atividadeFormResposta.deleteMany({
      where: { atividadeExecucaoId },
    });

    if (!payload.respostas?.length) return;

    const isFinalizada =
      normalizeString(payload.statusFluxo)?.toLowerCase() === 'finalizada';

    const respostaData = payload.respostas.map((r) => {
      const fotoId = this.resolvePhotoRef(
        r.fotoRef,
        photoRefMap,
        `respostas.${r.perguntaChave}.fotoRef`,
      );
      const fotoExternalId = fotoId != null ? null : (r.fotoId ?? null);

      if (isFinalizada && r.obrigaFotoSnapshot === true) {
        if (fotoId == null && fotoExternalId == null) {
          throw AppError.validation(
            `Pergunta ${r.perguntaChave} exige foto, mas nenhuma foto foi enviada`,
          );
        }
      }

      return {
        atividadeExecucaoId,
        perguntaRemoteId: r.perguntaRemoteId ?? null,
        perguntaChaveSnapshot: r.perguntaChave,
        perguntaTituloSnapshot: r.perguntaTituloSnapshot,
        ordem: r.ordem ?? 0,
        respostaTexto: normalizeString(r.respostaTexto),
        obrigaFotoSnapshot: r.obrigaFotoSnapshot ?? false,
        fotoId,
        fotoExternalId,
        dataResposta: parseDateOrNull(r.dataResposta) ?? new Date(),
        createdBy,
      };
    });

    await tx.atividadeFormResposta.createMany({
      data: respostaData,
    });
  }

  private async persistEventos(
    tx: Prisma.TransactionClient,
    atividadeExecucaoId: number,
    payload: AtividadeUploadRequestContract,
    createdBy: string,
  ) {
    await tx.atividadeEvento.deleteMany({ where: { atividadeExecucaoId } });
    if (!payload.eventos?.length) return;

    await tx.atividadeEvento.createMany({
      data: payload.eventos.map((e) => ({
        atividadeExecucaoId,
        tipoEvento: e.tipoEvento,
        locationTrackId: e.locationTrackId ?? null,
        latitude: e.latitude ?? null,
        longitude: e.longitude ?? null,
        accuracy: e.accuracy ?? null,
        detalhe: normalizeString(e.detalhe),
        capturadoEm: parseDateOrNull(e.capturadoEm) ?? new Date(),
        signature: normalizeString(
          `${e.tipoEvento}|${e.capturadoEm ?? ''}|${e.latitude ?? ''}|${e.longitude ?? ''}`,
        ),
        createdBy,
      })),
    });
  }

  private async persistAprs(
    tx: PrismaService,
    atividadeExecucaoId: number,
    payload: AtividadeUploadRequestContract,
    createdBy: string,
  ) {
    if (!payload.aprs?.length) return;

    const turnoEletricistas = await tx.turnoEletricista.findMany({
      where: {
        turnoId: payload.turnoId,
        deletedAt: null,
      },
      select: {
        id: true,
        eletricistaId: true,
        eletricista: {
          select: {
            nome: true,
            matricula: true,
          },
        },
      },
    });

    const turnoEletricistasById = new Map(
      turnoEletricistas.map((item) => [item.id, item]),
    );
    const turnoEletricistasByEletricistaId = new Map(
      turnoEletricistas.map((item) => [item.eletricistaId, item]),
    );

    for (const apr of payload.aprs) {
      const aprTurnoId = apr.turnoId ?? payload.turnoId;
      if (aprTurnoId !== payload.turnoId) {
        throw AppError.validation(
          `APR ${apr.aprUuid} informada com turnoId diferente do upload`,
        );
      }

      const assinaturas = this.resolveAprAssinaturas(
        apr,
        turnoEletricistas,
        turnoEletricistasById,
        turnoEletricistasByEletricistaId,
      );

      const preenchidaEm = parseDateOrNull(apr.preenchidaEm) ?? new Date();
      const vinculadaAoServico = apr.vinculadaAoServico ?? true;
      const aprSignature = sha256Text(
        `${apr.aprUuid}|${preenchidaEm.toISOString()}|${normalizeString(apr.observacoes) ?? ''}`,
      );

      const aprPreenchida = await tx.atividadeAprPreenchida.upsert({
        where: { aprUuid: apr.aprUuid },
        create: {
          aprUuid: apr.aprUuid,
          remoteId: apr.aprRemoteId ?? null,
          turnoId: payload.turnoId,
          atividadeExecucaoId: vinculadaAoServico ? atividadeExecucaoId : null,
          aprId: apr.aprModeloId ?? null,
          tipoAtividadeId:
            apr.tipoAtividadeRemoteId ?? payload.tipoAtividadeRemoteId ?? null,
          tipoAtividadeServicoId:
            apr.tipoServicoRemoteId ?? payload.tipoServicoRemoteId ?? null,
          observacoes: normalizeString(apr.observacoes),
          preenchidaEm,
          latitude: apr.latitude ?? null,
          longitude: apr.longitude ?? null,
          vinculadaAoServico,
          signature: aprSignature,
          createdBy,
        },
        update: {
          remoteId: apr.aprRemoteId ?? null,
          turnoId: payload.turnoId,
          atividadeExecucaoId: vinculadaAoServico ? atividadeExecucaoId : null,
          aprId: apr.aprModeloId ?? null,
          tipoAtividadeId:
            apr.tipoAtividadeRemoteId ?? payload.tipoAtividadeRemoteId ?? null,
          tipoAtividadeServicoId:
            apr.tipoServicoRemoteId ?? payload.tipoServicoRemoteId ?? null,
          observacoes: normalizeString(apr.observacoes),
          preenchidaEm,
          latitude: apr.latitude ?? null,
          longitude: apr.longitude ?? null,
          vinculadaAoServico,
          signature: aprSignature,
          updatedBy: createdBy,
        },
        select: { id: true },
      });

      await tx.atividadeAprResposta.deleteMany({
        where: {
          atividadeAprPreenchidaId: aprPreenchida.id,
        },
      });
      await tx.atividadeAprAssinatura.deleteMany({
        where: {
          atividadeAprPreenchidaId: aprPreenchida.id,
        },
      });

      if (apr.respostas.length) {
        const respostasData = apr.respostas.map((resposta, idx) => {
          const perguntaNomeSnapshot = normalizeString(
            resposta.aprPerguntaNomeSnapshot,
          );
          if (!perguntaNomeSnapshot) {
            throw AppError.validation(
              `APR ${apr.aprUuid} com resposta sem nome da pergunta (índice ${idx})`,
            );
          }

          const tipoRespostaSnapshot = normalizeString(
            resposta.tipoRespostaSnapshot,
          );
          if (!tipoRespostaSnapshot) {
            throw AppError.validation(
              `APR ${apr.aprUuid} com resposta sem tipoRespostaSnapshot (índice ${idx})`,
            );
          }

          return {
            atividadeAprPreenchidaId: aprPreenchida.id,
            aprGrupoPerguntaId: resposta.aprGrupoPerguntaId ?? null,
            aprPerguntaId: resposta.aprPerguntaId ?? null,
            aprOpcaoRespostaId: resposta.aprOpcaoRespostaId ?? null,
            grupoNomeSnapshot: normalizeString(
              resposta.aprGrupoPerguntaNomeSnapshot,
            ),
            perguntaNomeSnapshot,
            tipoRespostaSnapshot,
            opcaoNomeSnapshot: normalizeString(
              resposta.aprOpcaoRespostaNomeSnapshot,
            ),
            respostaTexto: normalizeString(resposta.respostaTexto),
            marcado:
              typeof resposta.marcado === 'boolean' ? resposta.marcado : null,
            ordemGrupo: resposta.ordemGrupo ?? 0,
            ordemPergunta: resposta.ordemPergunta ?? 0,
            dataResposta: parseDateOrNull(resposta.dataResposta) ?? preenchidaEm,
            createdBy,
          };
        });

        await tx.atividadeAprResposta.createMany({
          data: respostasData,
        });
      }

      await tx.atividadeAprAssinatura.createMany({
        data: assinaturas.map((assinatura) => ({
          atividadeAprPreenchidaId: aprPreenchida.id,
          turnoEletricistaId: assinatura.turnoEletricistaId,
          eletricistaId: assinatura.eletricistaId,
          nomeAssinante: assinatura.nomeAssinante,
          matriculaAssinante: assinatura.matriculaAssinante,
          assinaturaHash: assinatura.assinaturaHash,
          assinaturaData: assinatura.assinaturaData,
          assinanteExtra: assinatura.assinanteExtra,
          createdBy,
        })),
      });
    }
  }

  private resolveAprAssinaturas(
    apr: AtividadeUploadAprContract,
    turnoEletricistas: TurnoEletricistaSnapshot[],
    turnoEletricistasById: Map<number, TurnoEletricistaSnapshot>,
    turnoEletricistasByEletricistaId: Map<number, TurnoEletricistaSnapshot>,
  ) {
    if (!apr.assinaturas.length) {
      throw AppError.validation(
        `APR ${apr.aprUuid} deve conter pelo menos uma assinatura`,
      );
    }

    const assinaramTurno = new Set<number>();

    const assinaturas = apr.assinaturas.map((assinatura, assinaturaIndex) => {
      const turnoEletricistaById =
        assinatura.turnoEletricistaId != null
          ? turnoEletricistasById.get(assinatura.turnoEletricistaId)
          : null;

      if (assinatura.turnoEletricistaId != null && !turnoEletricistaById) {
        throw AppError.validation(
          `APR ${apr.aprUuid} com assinatura vinculada a turnoEletricistaId inválido (${assinatura.turnoEletricistaId})`,
        );
      }

      const turnoEletricistaByEletricista =
        assinatura.eletricistaId != null
          ? turnoEletricistasByEletricistaId.get(assinatura.eletricistaId)
          : null;

      if (
        turnoEletricistaById &&
        turnoEletricistaByEletricista &&
        turnoEletricistaById.id !== turnoEletricistaByEletricista.id
      ) {
        throw AppError.validation(
          `APR ${apr.aprUuid} com assinatura inconsistente entre turnoEletricistaId e eletricistaId`,
        );
      }

      const turnoEletricista =
        turnoEletricistaById ?? turnoEletricistaByEletricista ?? null;
      if (turnoEletricista) {
        assinaramTurno.add(turnoEletricista.id);
      }

      const eletricistaId =
        assinatura.eletricistaId ?? turnoEletricista?.eletricistaId ?? null;
      const nomeAssinante =
        normalizeString(assinatura.nomeAssinante) ??
        normalizeString(turnoEletricista?.eletricista.nome) ??
        null;

      if (!nomeAssinante) {
        throw AppError.validation(
          `APR ${apr.aprUuid} com assinatura sem identificação de nome`,
        );
      }

      const matriculaAssinante =
        normalizeString(assinatura.matriculaAssinante) ??
        normalizeString(turnoEletricista?.eletricista.matricula);
      const assinaturaData =
        parseDateOrNull(assinatura.assinaturaData) ??
        parseDateOrNull(apr.preenchidaEm) ??
        new Date();
      const assinaturaHash =
        normalizeString(assinatura.assinaturaHash) ??
        sha256Text(
          `${apr.aprUuid}|${nomeAssinante}|${matriculaAssinante ?? ''}|${assinaturaData.toISOString()}|${assinaturaIndex}`,
        );
      const assinanteExtra = assinatura.assinanteExtra ?? !turnoEletricista;

      return {
        turnoEletricistaId: turnoEletricista?.id ?? null,
        eletricistaId,
        nomeAssinante,
        matriculaAssinante,
        assinaturaHash,
        assinaturaData,
        assinanteExtra,
      };
    });

    const faltantes = turnoEletricistas.filter(
      (item) => !assinaramTurno.has(item.id),
    );
    if (faltantes.length) {
      const faltantesLabel = faltantes
        .map((item) => item.eletricista.nome)
        .join(', ');
      throw AppError.validation(
        `APR ${apr.aprUuid} sem assinatura de todos os componentes do turno. Faltantes: ${faltantesLabel}`,
      );
    }

    return assinaturas;
  }

  private resolvePhotoRef(
    ref: string | null | undefined,
    photoRefMap: Map<string, number>,
    sourceField: string,
  ): number | null {
    const normalized = normalizeString(ref);
    if (!normalized) return null;

    const photoId = photoRefMap.get(normalized);
    if (!photoId) {
      throw AppError.validation(
        `Referência de foto inválida em ${sourceField}: ${normalized}`,
      );
    }

    return photoId;
  }

  private collectPhotos(
    payload: AtividadeUploadRequestContract,
  ): CollectedPhoto[] {
    const out: CollectedPhoto[] = [];
    const usedRefs = new Set<string>();

    const pushPhoto = (
      ref: string | undefined,
      contexto: string,
      photo: AtividadeUploadPhotoContract | null | undefined,
    ) => {
      if (!photo) return;
      const normalizedRef =
        normalizeString(ref) ?? `${contexto}-${out.length + 1}`;
      if (usedRefs.has(normalizedRef)) {
        throw AppError.validation(
          `Referência de foto duplicada no payload: ${normalizedRef}`,
        );
      }
      usedRefs.add(normalizedRef);
      out.push({
        ref: normalizedRef,
        contexto: normalizeString(photo.contexto) ?? contexto,
        photo,
      });
    };

    payload.fotos?.forEach((photo, idx) => {
      pushPhoto(photo.ref, `fotos[${idx}]`, photo);
    });

    if (payload.medidor) {
      pushPhoto(
        payload.medidor.instaladoPhotoRef ?? undefined,
        'medidor:instalado',
        payload.medidor.instaladoFoto,
      );
      pushPhoto(
        payload.medidor.retiradoPhotoRef ?? undefined,
        'medidor:retirado',
        payload.medidor.retiradoFoto,
      );
    }

    payload.respostas?.forEach((resposta, idx) => {
      pushPhoto(
        resposta.fotoRef ?? undefined,
        `resposta:${resposta.perguntaChave || idx}`,
        resposta.foto,
      );
    });

    return out;
  }

  private async persistPhotosForActivity(
    atividadeExecucaoId: number,
    atividadeUuid: string,
    payload: AtividadeUploadRequestContract,
    createdBy: string,
    createdPhotos: StoredPhotoRecord[],
  ): Promise<Map<string, number>> {
    const collected = this.collectPhotos(payload);
    const out = new Map<string, number>();
    let index = 0;

    for (const item of collected) {
      index += 1;
      const inferredMimeType = inferMimeTypeFromDataUrl(item.photo.base64);
      const mimeType =
        normalizeString(item.photo.mimeType) ??
        inferredMimeType ??
        'image/jpeg';
      const rawBase64 = stripDataUrlPrefix(item.photo.base64);
      if (!rawBase64) {
        throw AppError.validation(`Foto ${item.ref} sem conteúdo base64`);
      }

      const buffer = Buffer.from(rawBase64, 'base64');
      if (!buffer.length) {
        throw AppError.validation(`Foto ${item.ref} inválida ou vazia`);
      }
      if (buffer.length > env.UPLOAD_MAX_FILE_SIZE_BYTES) {
        throw AppError.validation(
          `Foto ${item.ref} excede o limite máximo de ${env.UPLOAD_MAX_FILE_SIZE_BYTES} bytes`,
        );
      }

      const checksum = sha256Hex(buffer);
      const existingPhoto = await this.prisma.atividadeFoto.findFirst({
        where: {
          atividadeExecucaoId,
          checksum,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingPhoto) {
        out.set(item.ref, existingPhoto.id);
        continue;
      }

      const preferredName =
        normalizeString(item.photo.fileName) ??
        `foto-${index}.${extensionFromMimeType(mimeType)}`;
      const safeFilename = sanitizeFilename(preferredName);
      const storagePath = storagePathForPhoto(
        atividadeUuid,
        index,
        safeFilename,
      );

      const uploaded = await this.storage.upload({
        buffer,
        mimeType,
        size: buffer.length,
        path: storagePath,
      });

      const created = await this.prisma.atividadeFoto.create({
        data: {
          atividadeExecucaoId,
          atividadeUuid,
          ref: item.ref,
          contexto: item.contexto,
          checksum,
          mimeType,
          fileName: safeFilename,
          fileSize: buffer.length,
          storagePath: uploaded.path,
          url: uploaded.url,
          capturedAt: parseDateOrNull(item.photo.capturedAt),
          createdBy,
        },
        select: { id: true, storagePath: true },
      });

      createdPhotos.push({ id: created.id, path: created.storagePath });
      out.set(item.ref, created.id);
    }

    return out;
  }

  private async cleanupCreatedPhotos(createdPhotos: StoredPhotoRecord[]) {
    if (!createdPhotos.length) return;

    for (const photo of createdPhotos) {
      try {
        await this.prisma.atividadeFoto.delete({ where: { id: photo.id } });
      } catch (error: unknown) {
        this.logger.error(
          'Falha ao remover registro de foto após erro de upload de atividade',
          error,
          { atividadeFotoId: photo.id },
        );
      }
      try {
        await this.storage.delete(photo.path);
      } catch (error: unknown) {
        this.logger.error(
          'Falha ao remover arquivo de foto após erro de upload de atividade',
          error,
          { storagePath: photo.path },
        );
      }
    }
  }
}

export { ATIVIDADE_UPLOAD_STORAGE };
