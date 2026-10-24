/**
 * API Route para servir arquivos de anexos de justificativas
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Diretório base (absoluto) para uploads de anexos de justificativas.
 * Configurável via variável de ambiente UPLOAD_ROOT
 *
 * Se UPLOAD_ROOT estiver configurada, usa: {UPLOAD_ROOT}/justificativas/anexos
 * Caso contrário, usa: {process.cwd()}/uploads/justificativas/anexos
 */
const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'justificativas', 'anexos')
  : join(process.cwd(), 'uploads', 'justificativas', 'anexos');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    if (
      params.path.some(
        part => !part || part.startsWith('.') || /[/\\\0]/.test(part)
      )
    ) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    if (process.env.UPLOAD_STORAGE === 's3') {
      const base =
        process.env.UPLOAD_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL;
      if (!base)
        return new NextResponse('Storage indisponível', { status: 503 });
      const url = new URL(base);
      url.pathname = `/uploads/justificativas/anexos/${params.path.map(encodeURIComponent).join('/')}`;
      url.search = '';
      const upstream = await fetch(url, {
        cache: 'no-store',
        signal: request.signal,
      });
      const headers = new Headers();
      for (const name of [
        'content-type',
        'content-length',
        'cache-control',
        'etag',
        'last-modified',
      ]) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
      }
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
      });
    }
    const filePath = join(UPLOAD_ROOT, ...params.path);

    // Verificar se o arquivo existe
    if (!existsSync(filePath)) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // Ler o arquivo
    const fileBuffer = await readFile(filePath);

    // Determinar o tipo MIME baseado na extensão
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Retornar o arquivo (convertendo Buffer para Uint8Array)
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return new NextResponse('Erro ao servir arquivo', { status: 500 });
  }
}
