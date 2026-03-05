import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@nexa-oper/db';

import { env } from '../../../core/config/env';
import {
  findWorkspaceRoot,
  resolveAdditionalUploadRoots,
  resolveUploadRoot,
} from '../../../core/config/workspace-paths';
import { AppLogger } from '../../../core/logger/app-logger';
import { PrismaService } from '../../../database/prisma.service';
import { UploadEvidenceLinkService } from '../evidence/upload-evidence-link.service';

const JOB_NAME = 'checklist-photo-reconcile';
const UPLOAD_TYPE_CHECKLIST_REPROVA = 'checklist-reprova';
const CHECKLIST_PHOTO_TYPES = new Set([
  'checklistreprova',
  UPLOAD_TYPE_CHECKLIST_REPROVA,
  'pendencia',
]);

type ChecklistPreenchidoRef = {
  id: number;
  uuid: string;
  turnoId: number;
};

type ChecklistRespostaRef = {
  id: number;
  perguntaId: number;
  checklistPreenchidoId: number;
  ChecklistPendencia: { id: number } | null;
};

type ReconcileSummary = {
  mobileBackfill: number;
  checklistBackfill: number;
  countersUpdated: number;
  skipped: number;
};

function toJson(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toJson(item))
      .filter((item) => item !== undefined);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, toJson(item)] as const)
      .filter(([, item]) => item !== undefined);
    return Object.fromEntries(entries);
  }
  return undefined;
}

function normalizeSlashes(value: string): string {
  return value.replaceAll(/\\+/g, '/');
}

function normalizeRelativePath(
  urlValue: string | null | undefined,
  pathValue: string | null | undefined,
): string | null {
  const normalizedUrl = normalizeSlashes(String(urlValue ?? ''));
  const normalizedPath = normalizeSlashes(String(pathValue ?? ''));

  if (normalizedUrl.startsWith('/uploads/')) {
    return normalizedUrl.slice('/uploads/'.length);
  }
  if (normalizedUrl.startsWith('/mobile/photos/')) {
    return `mobile/photos/${normalizedUrl.slice('/mobile/photos/'.length)}`;
  }

  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return normalizedPath.slice(uploadsIndex + '/uploads/'.length);
  }

  if (normalizedPath.startsWith('uploads/')) {
    return normalizedPath.slice('uploads/'.length);
  }

  if (normalizedPath && !path.isAbsolute(normalizedPath)) {
    return normalizedPath.replace(/^\/+/, '');
  }

  return null;
}

function inferMimeType(filename: string, fallback?: string | null): string {
  if (fallback && fallback.trim().length > 0) {
    return fallback;
  }

  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function checksumSha256(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

@Injectable()
export class ChecklistPhotoReconcileJob
  implements OnModuleInit, OnModuleDestroy
{
  private intervalTimer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly instanceId = `${os.hostname()}:${process.pid}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly linkService: UploadEvidenceLinkService,
  ) {}

  onModuleInit(): void {
    if (!env.CHECKLIST_PHOTO_RECONCILE_ENABLED) {
      return;
    }

    const delayMs = env.CHECKLIST_PHOTO_RECONCILE_STARTUP_DELAY_MS;
    this.logger.info('Job de reconciliacao de fotos habilitado', {
      intervalMs: env.CHECKLIST_PHOTO_RECONCILE_INTERVAL_MS,
      startupDelayMs: delayMs,
      lockTtlMs: env.CHECKLIST_PHOTO_RECONCILE_LOCK_TTL_MS,
    });

    this.startupTimer = setTimeout(() => {
      this.runSafely().catch((error: unknown) => {
        this.logger.error(
          'Falha ao iniciar ciclo de reconciliacao de fotos',
          error,
        );
      });
      this.intervalTimer = setInterval(() => {
        this.runSafely().catch((error: unknown) => {
          this.logger.error(
            'Falha no ciclo agendado de reconciliacao de fotos',
            error,
          );
        });
      }, env.CHECKLIST_PHOTO_RECONCILE_INTERVAL_MS);
      this.intervalTimer.unref?.();
    }, delayMs);
    this.startupTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async runSafely(): Promise<void> {
    if (this.running) {
      this.logger.warn('Job de reconciliacao em execucao; novo ciclo ignorado');
      return;
    }

    this.running = true;
    try {
      await this.runOnce();
    } catch (error: unknown) {
      this.logger.error(
        'Falha no job de reconciliacao de fotos de checklist',
        error,
      );
    } finally {
      this.running = false;
    }
  }

  private async runOnce(): Promise<void> {
    const acquired = await this.acquireJobLock();
    if (!acquired) {
      return;
    }

    const startedAt = Date.now();
    try {
      const touchedRespostaIds = new Set<number>();
      const summary: ReconcileSummary = {
        mobileBackfill: 0,
        checklistBackfill: 0,
        countersUpdated: 0,
        skipped: 0,
      };

      const mobileResult =
        await this.reconcileFromMobilePhotos(touchedRespostaIds);
      summary.mobileBackfill = mobileResult.created;
      summary.skipped += mobileResult.skipped;

      const checklistResult =
        await this.reconcileFromChecklistFolders(touchedRespostaIds);
      summary.checklistBackfill = checklistResult.created;
      summary.skipped += checklistResult.skipped;

      summary.countersUpdated =
        await this.reconcileRespostaCounters(touchedRespostaIds);

      this.logger.info('Job de reconciliacao de fotos concluido', {
        durationMs: Date.now() - startedAt,
        ...summary,
      });
    } finally {
      await this.releaseJobLock();
    }
  }

  private async acquireJobLock(): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.CHECKLIST_PHOTO_RECONCILE_LOCK_TTL_MS,
    );

    try {
      await this.prisma.jobLock.create({
        data: {
          jobName: JOB_NAME,
          lockedAt: null,
          lockedBy: null,
          expiresAt: null,
        },
      });
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code !== 'P2002') {
        throw error;
      }
    }

    const claim = await this.prisma.jobLock.updateMany({
      where: {
        jobName: JOB_NAME,
        OR: [
          { expiresAt: null },
          { expiresAt: { lt: now } },
          { lockedBy: this.instanceId },
        ],
      },
      data: {
        lockedAt: now,
        lockedBy: this.instanceId,
        expiresAt,
      },
    });

    return claim.count > 0;
  }

  private async releaseJobLock(): Promise<void> {
    const now = new Date();
    await this.prisma.jobLock.updateMany({
      where: {
        jobName: JOB_NAME,
        lockedBy: this.instanceId,
      },
      data: {
        expiresAt: now,
      },
    });
  }

  private getScanRoots(): string[] {
    const workspaceRoot = findWorkspaceRoot(process.cwd());
    const configuredRoots = (env.CHECKLIST_PHOTO_RECONCILE_SCAN_ROOTS ?? [])
      .map((root) => root.trim())
      .filter(Boolean)
      .map((root) =>
        path.isAbsolute(root)
          ? path.resolve(root)
          : path.resolve(workspaceRoot, root),
      );

    if (configuredRoots.length > 0) {
      return [...new Set(configuredRoots)];
    }

    const primary = resolveUploadRoot(env.UPLOAD_ROOT);
    const legacy = resolveAdditionalUploadRoots(
      env.UPLOAD_ROOT,
      env.UPLOAD_LEGACY_ROOTS,
    );
    return [...new Set([primary, ...legacy])];
  }

  private buildPublicUrl(relativePath: string): string {
    const normalized = normalizeSlashes(relativePath).replace(/^\/+/, '');
    const publicBaseUrl = env.UPLOAD_BASE_URL?.replace(/\/+$/g, '');
    if (publicBaseUrl) {
      return `${publicBaseUrl}/${normalized}`;
    }
    return `/uploads/${normalized}`;
  }

  private async resolveChecklistPreenchido(params: {
    turnoId: number;
    checklistPreenchidoId: number | null;
    checklistUuid: string | null;
  }): Promise<ChecklistPreenchidoRef | null> {
    const { turnoId, checklistPreenchidoId, checklistUuid } = params;
    if (checklistPreenchidoId !== null) {
      const byId = await this.prisma.checklistPreenchido.findFirst({
        where: { id: checklistPreenchidoId, turnoId, deletedAt: null },
        select: { id: true, uuid: true, turnoId: true },
      });
      if (byId) {
        return byId;
      }
    }

    if (checklistUuid) {
      const byUuid = await this.prisma.checklistPreenchido.findFirst({
        where: { uuid: checklistUuid, turnoId, deletedAt: null },
        select: { id: true, uuid: true, turnoId: true },
      });
      if (byUuid) {
        return byUuid;
      }
    }

    return null;
  }

  private resolveResposta(
    checklistPreenchidoId: number,
    perguntaId: number,
  ): Promise<ChecklistRespostaRef | null> {
    return this.prisma.checklistResposta.findFirst({
      where: {
        checklistPreenchidoId,
        perguntaId,
        deletedAt: null,
      },
      select: {
        id: true,
        perguntaId: true,
        checklistPreenchidoId: true,
        ChecklistPendencia: {
          select: { id: true },
        },
      },
    });
  }

  private async obterOuCriarPendencia(resposta: {
    id: number;
    checklistPreenchidoId: number;
    ChecklistPendencia: { id: number } | null;
  }): Promise<number | null> {
    if (resposta.ChecklistPendencia) {
      return resposta.ChecklistPendencia.id;
    }

    const checklistPreenchido =
      await this.prisma.checklistPreenchido.findUnique({
        where: { id: resposta.checklistPreenchidoId },
        select: { turnoId: true },
      });
    if (!checklistPreenchido) {
      return null;
    }

    try {
      const created = await this.prisma.checklistPendencia.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPreenchidoId: resposta.checklistPreenchidoId,
          turnoId: checklistPreenchido.turnoId,
          status: 'AGUARDANDO_TRATAMENTO',
          createdBy: 'system',
        },
        select: { id: true },
      });
      return created.id;
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code !== 'P2002') {
        throw error;
      }
      const existing = await this.prisma.checklistPendencia.findUnique({
        where: { checklistRespostaId: resposta.id },
        select: { id: true },
      });
      return existing?.id ?? null;
    }
  }

  private async upsertChecklistRespostaFoto(params: {
    resposta: ChecklistRespostaRef;
    checklistPreenchido: ChecklistPreenchidoRef;
    relativePath: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    sincronizadoEm: Date;
    metadata: Record<string, unknown>;
  }): Promise<boolean> {
    const {
      resposta,
      checklistPreenchido,
      relativePath,
      fileSize,
      mimeType,
      checksum,
      sincronizadoEm,
      metadata,
    } = params;

    const pathConflict = await this.prisma.checklistRespostaFoto.findFirst({
      where: {
        caminhoArquivo: relativePath,
        deletedAt: null,
      },
      select: {
        checklistRespostaId: true,
      },
    });
    if (pathConflict && pathConflict.checklistRespostaId !== resposta.id) {
      this.logger.warn(
        'Foto ignorada por conflito de caminho em outra resposta',
        {
          relativePath,
          targetRespostaId: resposta.id,
          existingRespostaId: pathConflict.checklistRespostaId,
        },
      );
      return false;
    }

    const existing = await this.prisma.checklistRespostaFoto.findFirst({
      where: {
        checklistRespostaId: resposta.id,
        checksum,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) {
      const checklistPendenciaId = await this.obterOuCriarPendencia(resposta);
      await this.prisma.checklistRespostaFoto.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPendenciaId,
          caminhoArquivo: relativePath,
          urlPublica: this.buildPublicUrl(relativePath),
          tamanhoBytes: BigInt(fileSize),
          mimeType,
          checksum,
          sincronizadoEm,
          metadados: toJson(metadata) as Prisma.InputJsonValue,
          createdBy: 'system',
        },
      });
    }

    const idempotencyKey = `checklist-reprova:reconcile:${checklistPreenchido.id}:${resposta.id}:${checksum}`;
    const evidence = await this.prisma.uploadEvidence.upsert({
      where: { idempotencyKey },
      create: {
        tipo: UPLOAD_TYPE_CHECKLIST_REPROVA,
        entityType: 'checklistPreenchido',
        entityId: String(checklistPreenchido.id),
        url: this.buildPublicUrl(relativePath),
        path: relativePath,
        tamanho: fileSize,
        mimeType,
        nomeArquivo: path.basename(relativePath),
        checksum,
        idempotencyKey,
        createdBy: 'system',
      },
      update: {
        url: this.buildPublicUrl(relativePath),
        path: relativePath,
        tamanho: fileSize,
        mimeType,
        nomeArquivo: path.basename(relativePath),
        checksum,
      },
      select: { id: true },
    });

    await this.linkService.upsertFromEvidence({
      uploadEvidenceId: evidence.id,
      createdBy: 'system',
      ctx: {
        type: UPLOAD_TYPE_CHECKLIST_REPROVA,
        entityType: 'checklistPreenchido',
        entityId: String(checklistPreenchido.id),
        metadata: {
          turnoId: checklistPreenchido.turnoId,
          checklistPreenchidoId: checklistPreenchido.id,
          checklistRespostaId: resposta.id,
          checklistPerguntaId: resposta.perguntaId,
          syncOrigin: 'cron-reconcile',
          ...metadata,
        },
      },
    });

    return true;
  }

  private async findPhysicalFile(params: {
    relativePath: string;
    absoluteHint?: string | null;
  }): Promise<string | null> {
    if (env.UPLOAD_STORAGE === 's3') {
      return params.absoluteHint ?? null;
    }

    if (
      params.absoluteHint &&
      path.isAbsolute(params.absoluteHint) &&
      (await fileExists(params.absoluteHint))
    ) {
      return params.absoluteHint;
    }

    const roots = this.getScanRoots();
    for (const root of roots) {
      const candidate = path.join(root, params.relativePath);
      if (await fileExists(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async reconcileFromMobilePhotos(
    touchedRespostaIds: Set<number>,
  ): Promise<{
    created: number;
    skipped: number;
  }> {
    const rows = await this.prisma.mobilePhoto.findMany({
      where: {
        deletedAt: null,
        checklistPerguntaId: { not: null },
        OR: [
          { checklistPreenchidoId: { not: null } },
          { checklistUuid: { not: null } },
        ],
      },
      select: {
        id: true,
        tipo: true,
        turnoId: true,
        checklistPreenchidoId: true,
        checklistUuid: true,
        checklistPerguntaId: true,
        storagePath: true,
        url: true,
        mimeType: true,
        fileName: true,
        fileSize: true,
        checksum: true,
        capturedAt: true,
      },
      orderBy: { id: 'asc' },
      take: env.CHECKLIST_PHOTO_RECONCILE_MAX_FILES,
    });

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!CHECKLIST_PHOTO_TYPES.has(String(row.tipo || '').toLowerCase())) {
        skipped += 1;
        continue;
      }

      const checklistPreenchido = await this.resolveChecklistPreenchido({
        turnoId: row.turnoId,
        checklistPreenchidoId: row.checklistPreenchidoId ?? null,
        checklistUuid: row.checklistUuid ?? null,
      });
      if (!checklistPreenchido || row.checklistPerguntaId === null) {
        skipped += 1;
        continue;
      }

      const resposta = await this.resolveResposta(
        checklistPreenchido.id,
        row.checklistPerguntaId,
      );
      if (!resposta) {
        skipped += 1;
        continue;
      }

      const relativePath = normalizeRelativePath(row.url, row.storagePath);
      if (!relativePath) {
        skipped += 1;
        continue;
      }

      const physical = await this.findPhysicalFile({
        relativePath,
        absoluteHint: path.isAbsolute(row.storagePath) ? row.storagePath : null,
      });
      if (env.UPLOAD_STORAGE === 'local' && !physical) {
        skipped += 1;
        continue;
      }

      let { checksum } = row;
      if (!checksum && physical) {
        checksum = await checksumSha256(physical);
      }
      if (!checksum) {
        skipped += 1;
        continue;
      }

      const synced = await this.upsertChecklistRespostaFoto({
        resposta,
        checklistPreenchido,
        relativePath: normalizeSlashes(relativePath),
        fileSize: row.fileSize,
        mimeType: inferMimeType(row.fileName, row.mimeType),
        checksum,
        sincronizadoEm: row.capturedAt ?? new Date(),
        metadata: {
          source: 'mobile-photo-reconcile',
          mobilePhotoId: row.id,
          mobilePhotoTipo: row.tipo,
        },
      });

      touchedRespostaIds.add(resposta.id);
      if (synced) {
        created += 1;
      }
    }

    return { created, skipped };
  }

  private async resolveRespostaByEvidenceLink(params: {
    relativePath: string;
    checksum: string;
  }): Promise<ChecklistRespostaRef | null> {
    const links = await this.prisma.uploadEvidenceLink.findMany({
      where: {
        tipo: UPLOAD_TYPE_CHECKLIST_REPROVA,
        checklistRespostaId: { not: null },
        uploadEvidence: {
          tipo: UPLOAD_TYPE_CHECKLIST_REPROVA,
          OR: [{ path: params.relativePath }, { checksum: params.checksum }],
        },
      },
      select: {
        checklistRespostaId: true,
      },
      take: 2,
      distinct: ['checklistRespostaId'],
    });

    if (links.length !== 1 || links[0].checklistRespostaId === null) {
      return null;
    }

    return this.prisma.checklistResposta.findUnique({
      where: { id: links[0].checklistRespostaId },
      select: {
        id: true,
        perguntaId: true,
        checklistPreenchidoId: true,
        ChecklistPendencia: {
          select: { id: true },
        },
      },
    });
  }

  private async resolveRespostaByChecklistFolder(
    checklistPreenchidoId: number,
  ): Promise<ChecklistRespostaRef | null> {
    const respostas = await this.prisma.checklistResposta.findMany({
      where: {
        checklistPreenchidoId,
        deletedAt: null,
        OR: [{ aguardandoFoto: true }, { ChecklistPendencia: { isNot: null } }],
      },
      select: {
        id: true,
        perguntaId: true,
        checklistPreenchidoId: true,
        ChecklistPendencia: {
          select: { id: true },
        },
      },
      orderBy: { id: 'asc' },
      take: 3,
    });

    if (respostas.length !== 1) {
      return null;
    }
    return respostas[0];
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async reconcileFromChecklistFolders(
    touchedRespostaIds: Set<number>,
  ): Promise<{ created: number; skipped: number }> {
    const scanRoots = this.getScanRoots();
    const maxFiles = env.CHECKLIST_PHOTO_RECONCILE_MAX_FILES;
    const files: Array<{
      root: string;
      absolutePath: string;
      relativePath: string;
      checklistRef: string;
    }> = [];

    for (const root of scanRoots) {
      if (files.length >= maxFiles) {
        break;
      }
      const checklistRoot = path.join(root, 'checklists');
      if (!(await fileExists(checklistRoot))) {
        continue;
      }

      const checklistDirs = await fs.readdir(checklistRoot, {
        withFileTypes: true,
      });
      for (const checklistDir of checklistDirs) {
        if (files.length >= maxFiles) {
          break;
        }
        if (!checklistDir.isDirectory()) {
          continue;
        }

        const reprovaRoot = path.join(
          checklistRoot,
          checklistDir.name,
          'reprovas',
        );
        if (!(await fileExists(reprovaRoot))) {
          continue;
        }

        const reprovaFiles = await fs.readdir(reprovaRoot, {
          withFileTypes: true,
        });
        for (const reprovaFile of reprovaFiles) {
          if (files.length >= maxFiles) {
            break;
          }
          if (!reprovaFile.isFile()) {
            continue;
          }

          const absolutePath = path.join(reprovaRoot, reprovaFile.name);
          files.push({
            root,
            absolutePath,
            relativePath: normalizeSlashes(path.relative(root, absolutePath)),
            checklistRef: checklistDir.name,
          });
        }
      }
    }

    let created = 0;
    let skipped = 0;

    for (const file of files) {
      const existingByPath = await this.prisma.checklistRespostaFoto.findFirst({
        where: {
          caminhoArquivo: file.relativePath,
          deletedAt: null,
        },
        select: { checklistRespostaId: true },
      });
      if (existingByPath) {
        touchedRespostaIds.add(existingByPath.checklistRespostaId);
        skipped += 1;
        continue;
      }

      const checksum = await checksumSha256(file.absolutePath);
      const stat = await fs.stat(file.absolutePath);

      let resposta = await this.resolveRespostaByEvidenceLink({
        relativePath: file.relativePath,
        checksum,
      });

      let checklistPreenchido: ChecklistPreenchidoRef | null = null;
      if (resposta) {
        checklistPreenchido = await this.prisma.checklistPreenchido.findUnique({
          where: { id: resposta.checklistPreenchidoId },
          select: { id: true, uuid: true, turnoId: true },
        });
      } else {
        const byId = Number.parseInt(file.checklistRef, 10);
        checklistPreenchido = Number.isFinite(byId)
          ? await this.prisma.checklistPreenchido.findFirst({
              where: { id: byId, deletedAt: null },
              select: { id: true, uuid: true, turnoId: true },
            })
          : null;
        checklistPreenchido ??= await this.prisma.checklistPreenchido.findFirst(
          {
            where: { uuid: file.checklistRef, deletedAt: null },
            select: { id: true, uuid: true, turnoId: true },
          },
        );
        if (checklistPreenchido) {
          resposta = await this.resolveRespostaByChecklistFolder(
            checklistPreenchido.id,
          );
        }
      }

      if (!checklistPreenchido || !resposta) {
        skipped += 1;
        continue;
      }

      const synced = await this.upsertChecklistRespostaFoto({
        resposta,
        checklistPreenchido,
        relativePath: file.relativePath,
        fileSize: Number(stat.size),
        mimeType: inferMimeType(path.basename(file.absolutePath)),
        checksum,
        sincronizadoEm: stat.mtime,
        metadata: {
          source: 'checklist-folder-reconcile',
          absolutePath: file.absolutePath,
        },
      });

      touchedRespostaIds.add(resposta.id);
      if (synced) {
        created += 1;
      }
    }

    return { created, skipped };
  }

  private async reconcileRespostaCounters(
    touchedRespostaIds: Set<number>,
  ): Promise<number> {
    let updates = 0;

    const candidateIds = new Set<number>(touchedRespostaIds);
    const staleRows = await this.prisma.checklistResposta.findMany({
      where: {
        deletedAt: null,
        OR: [{ aguardandoFoto: true }, { fotosSincronizadas: { gt: 0 } }],
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: env.CHECKLIST_PHOTO_RECONCILE_MAX_RESPONSES,
    });
    staleRows.forEach((row) => candidateIds.add(row.id));

    for (const respostaId of candidateIds) {
      const row = await this.prisma.checklistResposta.findUnique({
        where: { id: respostaId },
        select: {
          id: true,
          aguardandoFoto: true,
          fotosSincronizadas: true,
          ChecklistPendencia: {
            select: { id: true },
          },
          _count: {
            select: {
              ChecklistRespostaFoto: {
                where: { deletedAt: null },
              },
            },
          },
        },
      });
      if (!row) {
        continue;
      }

      const totalFotos = row._count.ChecklistRespostaFoto;
      const shouldWaitForPhoto =
        totalFotos === 0 && row.ChecklistPendencia !== null;
      const shouldUpdate =
        row.fotosSincronizadas !== totalFotos ||
        row.aguardandoFoto !== shouldWaitForPhoto;

      if (!shouldUpdate) {
        continue;
      }

      await this.prisma.checklistResposta.update({
        where: { id: row.id },
        data: {
          fotosSincronizadas: totalFotos,
          aguardandoFoto: shouldWaitForPhoto,
          updatedBy: 'system',
        },
      });
      updates += 1;
    }

    return updates;
  }
}
