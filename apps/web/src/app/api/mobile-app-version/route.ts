import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth.config';
import { PERMISSIONS } from '@/lib/authz/permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { createHash } from 'crypto';

export const maxDuration = 300;

const APK_MAX_BYTES = 200 * 1024 * 1024;

const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'mobile')
  : join(process.cwd(), 'uploads', 'mobile');

function sanitizeFilename(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '');
  const clean = ascii
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '');
  return clean.slice(0, 120) || 'file.apk';
}

function parseOptionalInt(
  value: FormDataEntryValue | null
): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (
    !(session.user.permissions ?? []).includes(
      PERMISSIONS.MOBILE_APP_VERSION_VIEW
    )
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const versions = await prisma.mobileAppVersion.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(versions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (
    !(session.user.permissions ?? []).includes(
      PERMISSIONS.MOBILE_APP_VERSION_MANAGE
    )
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const versao = formData.get('versao') as string;
    const build = parseOptionalInt(formData.get('build'));
    const plataforma = formData.get('plataforma') as string;
    const notas = formData.get('notas') as string;
    const ativoParam = formData.get('ativo') as string;
    const ativo = ativoParam === 'true';
    const wipeRequired = formData.get('wipeRequired') === 'true';
    const minSupportedBuild = parseOptionalInt(
      formData.get('minSupportedBuild')
    );
    const minLoginBuild = parseOptionalInt(formData.get('minLoginBuild'));
    const minOpenTurnoBuild = parseOptionalInt(
      formData.get('minOpenTurnoBuild')
    );
    const minUploadBuild = parseOptionalInt(formData.get('minUploadBuild'));

    if (!file || !versao || build == null || !plataforma) {
      return NextResponse.json(
        { error: 'Faltam campos obrigatórios' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > APK_MAX_BYTES) {
      return NextResponse.json(
        {
          error: `APK excede o limite de ${Math.floor(APK_MAX_BYTES / (1024 * 1024))} MB`,
        },
        { status: 413 }
      );
    }
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const safeFilename = sanitizeFilename(file.name);
    const fileName = `${Date.now()}-${safeFilename}`;
    const filePath = join(UPLOAD_ROOT, 'apks', fileName);

    // Ensure dir exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(filePath, buffer);
    const arquivoUrl = `/uploads/mobile/apks/${fileName}`; // Proxied via next.config.ts
    const arquivoPath = join('mobile', 'apks', fileName);

    const result = await prisma.$transaction(async (tx: any) => {
      if (ativo) {
        await tx.mobileAppVersion.updateMany({
          where: { plataforma },
          data: { ativo: false },
        });
      }

      return tx.mobileAppVersion.create({
        data: {
          versao,
          build,
          plataforma,
          notas: notas || undefined,
          arquivoUrl,
          arquivoPath,
          apkSizeBytes: buffer.byteLength,
          sha256,
          ativo,
          wipeRequired,
          minSupportedBuild,
          minLoginBuild,
          minOpenTurnoBuild,
          minUploadBuild,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao salvar arquivo' },
      { status: 500 }
    );
  }
}
