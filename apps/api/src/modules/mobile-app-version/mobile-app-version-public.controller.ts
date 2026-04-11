import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { MobileAppVersionService } from './mobile-app-version.service';
import { Public } from '../../core/auth/public.decorator';
import { BypassEnvelope } from '../../core/http/decorators/bypass-envelope.decorator';

@ApiTags('public')
@Controller('public/mobile-app-version')
export class MobileAppVersionPublicController {
  constructor(private readonly service: MobileAppVersionService) {}

  @Public()
  @Get('latest/download')
  @ApiOperation({
    summary: 'Redireciona para o download do APK ativo mais recente',
  })
  @ApiQuery({
    name: 'plataforma',
    required: false,
    example: 'android',
    description: 'Padrão: android',
  })
  async downloadLatest(
    @Query('plataforma') plataforma: string,
    @Res() res: Response,
    // Permite uso com JWT também, mas não obrigatório nativamente por ser /public/ (depende do AuthGuard global)
    // Se o AuthGuard for global e bloquear /public/, deve-se usar @Public() se existir.
  ) {
    const plat = plataforma || 'android';
    const url = await this.service.getLatestReleaseUrl(plat);

    // Faz um HTTP 302 para iniciar o download/redirecionar pro Storage
    return res.redirect(302, url);
  }

  @Public()
  @Get('releases')
  @BypassEnvelope()
  @Header('Content-Type', 'text/html')
  @ApiOperation({
    summary: 'Página HTML pública para listar e baixar versões do App',
  })
  async downloadPage() {
    const versions = await this.service.findAll();

    let listHtml = '';
    for (const v of versions) {
      listHtml += `
        <div class="version-card ${v.ativo ? 'active-version' : ''}">
          <div class="version-header">
            <h3>Versão: ${v.versao} ${v.ativo ? '<span class="badge">Oficial</span>' : ''}</h3>
            <span>${v.plataforma.toUpperCase()}</span>
          </div>
          <p class="notes">${v.notas || 'Sem notas de lançamento.'}</p>
          <div class="meta">
            <small>Lançado em: ${new Date(v.createdAt).toLocaleDateString('pt-BR')} às ${new Date(v.createdAt).toLocaleTimeString('pt-BR')}</small>
          </div>
          <a href="${v.arquivoUrl}" class="download-btn" download>↓ Baixar APK</a>
        </div>
      `;
    }

    if (versions.length === 0) {
      listHtml =
        '<div class="empty">Nenhuma versão disponível no momento.</div>';
    }

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nexa - Distruibuição Mobile</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
          }
          body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
          }
          .container {
            max-width: 800px;
            width: 100%;
            padding: 40px 20px;
          }
          h1 {
            text-align: center;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(to right, #2563eb, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p.subtitle {
            text-align: center;
            color: var(--text-muted);
            margin-bottom: 40px;
          }
          .version-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .version-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          }
          .active-version {
            border: 2px solid var(--primary);
          }
          .version-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .version-header h3 {
            margin: 0;
            font-size: 1.25rem;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .badge {
            background-color: #dbeafe;
            color: #1e40af;
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 9999px;
            font-weight: 600;
          }
          .notes {
            color: var(--text-muted);
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .meta {
            color: #94a3b8;
            margin-bottom: 20px;
          }
          .download-btn {
            display: inline-block;
            background-color: var(--primary);
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .download-btn:hover {
            background-color: var(--primary-hover);
          }
          .empty {
            text-align: center;
            padding: 40px;
            color: var(--text-muted);
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px dashed var(--border);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Nexa Mobile Dist</h1>
          <p class="subtitle">Baixe as versões recentes do aplicativo móvel.</p>
          <div class="downloads-list">
            ${listHtml}
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
