import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth.config';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'mobile')
  : join(process.cwd(), 'uploads', 'mobile');

function sanitizeFilename(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '');
  const clean = ascii.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^\.+/, '');
  return clean.slice(0, 120) || 'file.apk';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const versions = await prisma.mobileAppVersion.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(versions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const versao = formData.get('versao') as string;
    const plataforma = formData.get('plataforma') as string;
    const notas = formData.get('notas') as string;
    const ativoParam = formData.get('ativo') as string;
    const ativo = ativoParam === 'true';

    if (!file || !versao || !plataforma) {
      return NextResponse.json({ error: 'Faltam campos obrigatórios' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
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
          plataforma,
          notas,
          arquivoUrl,
          ativo,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar arquivo' }, { status: 500 });
  }
}
