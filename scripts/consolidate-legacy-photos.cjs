#!/usr/bin/env node

/**
 * Consolida referências legadas de fotos para o padrão atual:
 * - URL pública: /uploads/<relativePath>
 * - Path no banco: <relativePath> (sem caminho absoluto)
 *
 * Também copia arquivos de pastas legadas para o diretório de destino.
 *
 * Uso:
 *   node scripts/consolidate-legacy-photos.cjs --dry-run
 *   node scripts/consolidate-legacy-photos.cjs --apply
 *   node scripts/consolidate-legacy-photos.cjs --apply --limit=500
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { PrismaClient } = require('@nexa-oper/db');

const prisma = new PrismaClient();
const cwd = process.cwd();
const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const dryRun = !isApply;
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

function parseRoots(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fallback CSV
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveTargetRoot() {
  const raw =
    process.env.UPLOAD_TARGET_ROOT?.trim() || process.env.UPLOAD_ROOT?.trim();
  if (!raw) return path.join(cwd, 'uploads');
  return path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(cwd, raw);
}

function resolveLegacyRoots(targetRoot) {
  const envRoots = parseRoots(process.env.UPLOAD_LEGACY_ROOTS).map((root) =>
    path.isAbsolute(root) ? path.resolve(root) : path.resolve(cwd, root),
  );

  const defaults = [
    path.join(cwd, 'apps', 'api', 'uploads'),
    '/var/www/nexa-oper/uploads',
  ];

  return Array.from(new Set([...envRoots, ...defaults])).filter(
    (root) => root !== targetRoot,
  );
}

function normalizeSlashes(value) {
  return String(value || '').replace(/[\\]+/g, '/');
}

function normalizeRelativePath(url, storedPath) {
  const urlValue = normalizeSlashes(url || '');
  const pathValue = normalizeSlashes(storedPath || '');

  if (urlValue.startsWith('/uploads/')) return urlValue.slice('/uploads/'.length);
  if (urlValue.startsWith('/mobile/photos/')) {
    return `mobile/photos/${urlValue.slice('/mobile/photos/'.length)}`;
  }

  const uploadsIndex = pathValue.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return pathValue.slice(uploadsIndex + '/uploads/'.length);
  }

  if (pathValue && !pathValue.startsWith('/')) return pathValue;
  return null;
}

function buildPublicUrl(relativePath) {
  const normalized = normalizeSlashes(relativePath).replace(/^[/]+/, '');
  return `/uploads/${normalized}`;
}

function buildSourceCandidates({
  absoluteStoredPath,
  relativePath,
  targetRoot,
  legacyRoots,
}) {
  const candidates = [];
  if (absoluteStoredPath && path.isAbsolute(absoluteStoredPath)) {
    candidates.push(path.resolve(absoluteStoredPath));
  }

  const relativeFsPath = normalizeSlashes(relativePath);
  candidates.push(path.join(targetRoot, relativeFsPath));
  legacyRoots.forEach((root) => {
    candidates.push(path.join(root, relativeFsPath));
  });

  return Array.from(new Set(candidates));
}

async function ensureCopied(sourceCandidates, destinationPath) {
  const existingDestination = fs.existsSync(destinationPath);
  if (existingDestination) return { copied: false, sourcePath: destinationPath };

  for (const sourcePath of sourceCandidates) {
    if (!fs.existsSync(sourcePath)) continue;
    await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
    await fsp.copyFile(sourcePath, destinationPath);
    return { copied: true, sourcePath };
  }

  return { copied: false, sourcePath: null };
}

async function processChecklistFotos(targetRoot, legacyRoots) {
  const where = {
    deletedAt: null,
    OR: [
      { urlPublica: { startsWith: '/mobile/photos/' } },
      { caminhoArquivo: { startsWith: '/' } },
    ],
  };

  const rows = await prisma.checklistRespostaFoto.findMany({
    where,
    select: {
      id: true,
      caminhoArquivo: true,
      urlPublica: true,
    },
    orderBy: { id: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  let updated = 0;
  let copied = 0;
  let skippedNoSource = 0;
  let skippedNoPath = 0;

  for (const row of rows) {
    const relativePath = normalizeRelativePath(row.urlPublica, row.caminhoArquivo);
    if (!relativePath) {
      skippedNoPath += 1;
      continue;
    }

    const destinationPath = path.join(targetRoot, normalizeSlashes(relativePath));
    const sourceCandidates = buildSourceCandidates({
      absoluteStoredPath: row.caminhoArquivo,
      relativePath,
      targetRoot,
      legacyRoots,
    });

    const copyResult = await ensureCopied(sourceCandidates, destinationPath);
    if (!copyResult.sourcePath) {
      skippedNoSource += 1;
      continue;
    }

    if (copyResult.copied) copied += 1;

    if (!dryRun) {
      await prisma.checklistRespostaFoto.update({
        where: { id: row.id },
        data: {
          caminhoArquivo: normalizeSlashes(relativePath),
          urlPublica: buildPublicUrl(relativePath),
        },
      });
    }

    updated += 1;
  }

  return { scanned: rows.length, updated, copied, skippedNoSource, skippedNoPath };
}

async function processMobilePhotos(targetRoot, legacyRoots) {
  const where = {
    deletedAt: null,
    OR: [
      { url: { startsWith: '/mobile/photos/' } },
      { storagePath: { startsWith: '/' } },
    ],
  };

  const rows = await prisma.mobilePhoto.findMany({
    where,
    select: {
      id: true,
      url: true,
      storagePath: true,
    },
    orderBy: { id: 'asc' },
    ...(limit ? { take: limit } : {}),
  });

  let updated = 0;
  let copied = 0;
  let skippedNoSource = 0;
  let skippedNoPath = 0;

  for (const row of rows) {
    const relativePath = normalizeRelativePath(row.url, row.storagePath);
    if (!relativePath) {
      skippedNoPath += 1;
      continue;
    }

    const destinationPath = path.join(targetRoot, normalizeSlashes(relativePath));
    const sourceCandidates = buildSourceCandidates({
      absoluteStoredPath: row.storagePath,
      relativePath,
      targetRoot,
      legacyRoots,
    });

    const copyResult = await ensureCopied(sourceCandidates, destinationPath);
    if (!copyResult.sourcePath) {
      skippedNoSource += 1;
      continue;
    }

    if (copyResult.copied) copied += 1;

    if (!dryRun) {
      await prisma.mobilePhoto.update({
        where: { id: row.id },
        data: {
          storagePath: normalizeSlashes(relativePath),
          url: buildPublicUrl(relativePath),
        },
      });
    }

    updated += 1;
  }

  return { scanned: rows.length, updated, copied, skippedNoSource, skippedNoPath };
}

async function main() {
  const targetRoot = resolveTargetRoot();
  const legacyRoots = resolveLegacyRoots(targetRoot);

  console.log(`mode=${dryRun ? 'DRY_RUN' : 'APPLY'}`);
  console.log(`targetRoot=${targetRoot}`);
  console.log(`legacyRoots=${legacyRoots.join(', ') || '(none)'}`);
  if (limit) console.log(`limit=${limit}`);

  await fsp.mkdir(targetRoot, { recursive: true });

  const checklistStats = await processChecklistFotos(targetRoot, legacyRoots);
  const mobileStats = await processMobilePhotos(targetRoot, legacyRoots);

  console.log('CHECKLIST_RESPOSTA_FOTO', checklistStats);
  console.log('MOBILE_PHOTO', mobileStats);

  if (dryRun) {
    console.log('Dry-run concluído. Rode com --apply para efetivar alterações.');
  } else {
    console.log('Migração concluída com sucesso.');
  }
}

main()
  .catch((error) => {
    console.error('Falha na consolidação de fotos legadas:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
