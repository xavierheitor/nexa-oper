/**
 * Serviço responsável por processar uploads de fotos enviados pelo aplicativo mobile.
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { randomUUID, createHash } from 'crypto';
import { dirname, extname, join, sep } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import {
  ALLOWED_MOBILE_PHOTO_MIME_TYPES,
  MAX_MOBILE_PHOTO_FILE_SIZE,
  MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX,
  MOBILE_PHOTO_UPLOAD_ROOT,
  SUPPORTED_MOBILE_PHOTO_TYPES,
} from '../constants/mobile-upload.constants';
import { PhotoUploadDto, PhotoUploadResponseDto } from '../dto';
import {
  createAuditData,
  getDefaultUserContext,
} from '@common/utils/audit';

type MulterFile = Express.Multer.File;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

/**
 * Serviço de upload de fotos mobile.
 *
 * Responsável por validar arquivos, garantir idempotência e persistir
 * metadados no banco de dados, retornando a URL para o aplicativo.
 */
@Injectable()
export class MobilePhotoUploadService {
  private readonly logger = new Logger(MobilePhotoUploadService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Processa o upload de uma foto recebida do aplicativo mobile.
   */
  async handleUpload(
    file: MulterFile | undefined,
    payload: PhotoUploadDto
  ): Promise<PhotoUploadResponseDto> {
    this.logger.log(`🚀 [UPLOAD] Iniciando upload - tipo: ${payload.tipo}, turnoId: ${payload.turnoId}`);
    this.logger.log(`📋 [UPLOAD] Payload completo:`, JSON.stringify(payload, null, 2));

    if (!file) {
      throw new BadRequestException('Arquivo da foto é obrigatório');
    }

    // ✅ Validação: Rejeitar fotos de checklist sem UUID
    if ((payload.tipo === 'checklistReprova' || payload.tipo === 'assinatura') &&
        (!payload.checklistUuid || payload.checklistUuid.trim() === '')) {
      throw new BadRequestException(
        `Fotos do tipo '${payload.tipo}' devem incluir checklistUuid obrigatório`
      );
    }

    this.validateFile(file);

    const checksum = this.computeChecksum(file.buffer);

    // Verificar duplicidade antes de escrever no disco
    const existing = await this.db
      .getPrisma()
      .mobilePhoto.findUnique({ where: { checksum } });

    if (existing) {
      this.logger.debug(
        `Foto duplicada detectada para checksum ${checksum}, retornando URL existente`
      );

      return {
        status: 'duplicate',
        url: existing.url,
        checksum: existing.checksum,
      };
    }

    const extension = this.resolveExtension(file);
    const relativePath = this.buildRelativePath(payload.turnoId, extension);
    const absolutePath = join(MOBILE_PHOTO_UPLOAD_ROOT, ...relativePath.parts);

    await this.ensureDirectory(dirname(absolutePath));
    await writeFile(absolutePath, file.buffer);

    const url = this.buildPublicUrl(relativePath.urlPath);

    const audit = createAuditData(getDefaultUserContext());

    const mobilePhoto = await this.db.getPrisma().mobilePhoto.create({
      data: {
        turnoId: payload.turnoId,
        tipo: this.normalizePhotoType(payload.tipo),
        checklistUuid: payload.checklistUuid ?? null,
        checklistPerguntaId: payload.checklistPerguntaId ?? null,
        sequenciaAssinatura: payload.sequenciaAssinatura ?? null,
        servicoId: payload.servicoId ?? null,
        fileName: relativePath.fileName,
        mimeType: file.mimetype,
        fileSize: file.size,
        checksum,
        storagePath: absolutePath,
        url,
        capturedAt: new Date(),
        ...audit,
      },
    });

    this.logger.log(
      `✅ [UPLOAD] Foto mobile salva - ID: ${mobilePhoto.id}, tipo: ${mobilePhoto.tipo}`
    );

    // Processar foto de pendência se aplicável
    const shouldProcessPendencia =
      (payload.tipo === 'pendencia' || payload.tipo === 'checklistReprova') &&
      payload.checklistPerguntaId;

    this.logger.log(
      `🔍 [UPLOAD] Deve processar pendência? ${shouldProcessPendencia}`
    );
    this.logger.log(
      `🔍 [UPLOAD] Condições: tipo=${payload.tipo}, checklistUuid=${payload.checklistUuid}, checklistPerguntaId=${payload.checklistPerguntaId}`
    );

    if (shouldProcessPendencia) {
      this.logger.log(`🔄 [UPLOAD] Iniciando processamento de pendência...`);

      if (payload.checklistUuid && payload.checklistUuid.trim() !== '') {
        // Usar UUID se disponível
        await this.processarFotoPendenciaComUuid(
          mobilePhoto.id,
          payload.turnoId,
          payload.checklistUuid,
          payload.checklistPerguntaId!
        );
      } else {
        // Fallback: usar apenas perguntaId quando UUID não estiver disponível
        await this.processarFotoPendenciaSemUuid(
          mobilePhoto.id,
          payload.turnoId,
          payload.checklistPerguntaId!
        );
      }
    } else {
      this.logger.log(`⏭️ [UPLOAD] Pulando processamento de pendência`);
    }

    this.logger.log(
      `Foto armazenada com sucesso: turno ${payload.turnoId} - ${relativePath.fileName}`
    );

    return {
      status: 'stored',
      url,
      checksum,
    };
  }

  /**
   * Garante que o arquivo está dentro dos limites aceitos.
   */
  private validateFile(file: MulterFile): void {
    if (file.size > MAX_MOBILE_PHOTO_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o tamanho máximo permitido');
    }

    if (!ALLOWED_MOBILE_PHOTO_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException('Tipo de arquivo não suportado');
    }
  }

  /**
   * Normaliza o tipo da foto para evitar divergência na persistência.
   */
  private normalizePhotoType(tipo: string): string {
    if (SUPPORTED_MOBILE_PHOTO_TYPES.includes(tipo as any)) {
      return tipo;
    }

    this.logger.warn(
      `Tipo de foto "${tipo}" não reconhecido, mantendo valor original`
    );
    return tipo;
  }

  /**
   * Calcula o checksum para garantir idempotência.
   */
  private computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Retorna a extensão do arquivo a partir do mimetype ou nome original.
   */
  private resolveExtension(file: MulterFile): string {
    if (MIME_EXTENSION_MAP[file.mimetype]) {
      return MIME_EXTENSION_MAP[file.mimetype];
    }

    const originalExt = extname(file.originalname);
    if (originalExt) {
      return originalExt.replace('.', '').toLowerCase();
    }

    return 'bin';
  }

  /**
   * Monta o caminho relativo onde a foto será armazenada.
   */
  private buildRelativePath(turnoId: number, extension: string): {
    parts: string[];
    fileName: string;
    urlPath: string;
  } {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .replace(/\..+/, '');

    const fileName = `${turnoId}_${timestamp}_${randomUUID()}.${extension}`;
    const parts = [turnoId.toString(), fileName];
    const urlPath = parts.join('/');

    return { parts, fileName, urlPath };
  }

  /**
   * Garante que o diretório existe antes de salvar o arquivo.
   */
  private async ensureDirectory(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true });
  }

  /**
   * Constrói a URL pública a partir do caminho relativo.
   */
  private buildPublicUrl(relativePath: string): string {
    const normalized = relativePath.split(sep).join('/');
    return `${MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX}/${normalized}`;
  }

  /**
   * Processa foto de pendência usando apenas perguntaId (fallback quando UUID não está disponível)
   *
   * @param mobilePhotoId - ID da foto mobile salva
   * @param turnoId - ID do turno na API
   * @param perguntaId - ID da pergunta (enviado como checklistRespostaId pelo app)
   */
  private async processarFotoPendenciaSemUuid(
    mobilePhotoId: number,
    turnoId: number,
    perguntaId: number
  ): Promise<void> {
    try {
      this.logger.log(
        `🔄 [PENDENCIA-SEM-UUID] Processando foto de pendência: turnoId=${turnoId}, perguntaId=${perguntaId}`
      );

      // Buscar a foto mobile
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(`❌ [PENDENCIA-SEM-UUID] Foto mobile não encontrada: ${mobilePhotoId}`);
        return;
      }

      // Buscar todas as respostas do turno com a pergunta específica
      const respostas = await this.db.getPrisma().checklistResposta.findMany({
        where: {
          perguntaId: perguntaId,
          checklistPreenchido: {
            turnoId: turnoId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        include: {
          ChecklistPendencia: true,
        },
      });

      this.logger.log(`🔍 [PENDENCIA-SEM-UUID] Encontradas ${respostas.length} respostas para perguntaId=${perguntaId} no turnoId=${turnoId}`);

      if (respostas.length === 0) {
        this.logger.warn(`⚠️ [PENDENCIA-SEM-UUID] Nenhuma resposta encontrada para perguntaId=${perguntaId} no turnoId=${turnoId}`);
        return;
      }

      // Processar cada resposta encontrada
      for (const resposta of respostas) {
        this.logger.log(`🔄 [PENDENCIA-SEM-UUID] Processando resposta ID: ${resposta.id}`);

        // Buscar ou criar pendência
        let pendencia = resposta.ChecklistPendencia;
        if (!pendencia) {
          this.logger.log(`📝 [PENDENCIA-SEM-UUID] Criando nova pendência para resposta ${resposta.id}`);
          pendencia = await this.db.getPrisma().checklistPendencia.create({
            data: {
              checklistRespostaId: resposta.id,
              checklistPreenchidoId: resposta.checklistPreenchidoId,
              turnoId: turnoId,
              status: 'AGUARDANDO_TRATAMENTO',
              createdAt: new Date(),
              createdBy: 'system',
            },
          });
        }

        // Criar registro na tabela ChecklistRespostaFoto
        const checklistRespostaFoto = await this.db.getPrisma().checklistRespostaFoto.create({
          data: {
            checklistRespostaId: resposta.id,
            checklistPendenciaId: pendencia.id,
            caminhoArquivo: mobilePhoto.storagePath,
            urlPublica: mobilePhoto.url,
            tamanhoBytes: BigInt(mobilePhoto.fileSize),
            mimeType: mobilePhoto.mimeType,
            sincronizadoEm: new Date(),
            metadados: {
              mobilePhotoId: mobilePhoto.id,
              tipo: mobilePhoto.tipo,
              capturedAt: mobilePhoto.capturedAt,
              turnoId,
              perguntaId,
              metodoVinculacao: 'sem-uuid-fallback',
            },
            createdAt: new Date(),
            createdBy: 'system',
          },
        });

        this.logger.log(
          `✅ [PENDENCIA-SEM-UUID] Foto vinculada com sucesso - RespostaFoto ID: ${checklistRespostaFoto.id}, Resposta ID: ${resposta.id}, Pendência ID: ${pendencia.id}`
        );

        // Atualizar contador de fotos sincronizadas na resposta e marcar como não aguardando mais foto
        await this.db.getPrisma().checklistResposta.update({
          where: { id: resposta.id },
          data: {
            fotosSincronizadas: {
              increment: 1,
            },
            aguardandoFoto: false, // ✅ Marcar como foto já sincronizada
            updatedAt: new Date(),
            updatedBy: 'system',
          },
        });

        this.logger.log(`📊 [PENDENCIA-SEM-UUID] Contador de fotos atualizado para resposta ${resposta.id}`);
      }

      this.logger.log(`✅ [PENDENCIA-SEM-UUID] Processamento concluído para ${respostas.length} resposta(s)`);
    } catch (error) {
      this.logger.error(
        `❌ [PENDENCIA-SEM-UUID] Erro ao processar foto de pendência: ${error}`,
        error
      );
    }
  }

  /**
   * Processa foto de pendência usando UUID do checklist preenchido
   *
   * @param mobilePhotoId - ID da foto mobile salva
   * @param turnoId - ID do turno na API
   * @param checklistUuid - UUID único do checklist preenchido
   * @param perguntaId - ID da pergunta (enviado como checklistRespostaId pelo app)
   */
  private async processarFotoPendenciaComUuid(
    mobilePhotoId: number,
    turnoId: number,
    checklistUuid: string,
    perguntaId: number
  ): Promise<void> {
    try {
      this.logger.log(
        `🔄 [PENDENCIA-UUID] Processando foto de pendência: turnoId=${turnoId}, checklistUuid=${checklistUuid}, perguntaId=${perguntaId}`
      );

      // Primeiro, verificar se o turno existe
      const turno = await this.db.getPrisma().turno.findUnique({
        where: { id: turnoId },
        select: { id: true, dataInicio: true }
      });

      if (!turno) {
        this.logger.error(`❌ [PENDENCIA-UUID] Turno não encontrado: turnoId=${turnoId}`);
        return;
      }

      this.logger.log(`✅ [PENDENCIA-UUID] Turno encontrado: ${turno.id}, dataInicio: ${turno.dataInicio}`);

      // Buscar o checklist preenchido pelo UUID
      const checklistPreenchido = await this.db.getPrisma().checklistPreenchido.findFirst({
        where: {
          uuid: checklistUuid,
          turnoId: turnoId,
        },
        include: {
          ChecklistResposta: {
            where: {
              perguntaId: perguntaId,
            },
            include: {
              ChecklistPendencia: true,
            },
          },
        },
      });

      this.logger.log(`🔍 [PENDENCIA-UUID] Checklist encontrado pelo UUID: ${checklistPreenchido ? 'SIM' : 'NÃO'}`);

      if (checklistPreenchido) {
        this.logger.log(`📋 [PENDENCIA-UUID] Checklist ID: ${checklistPreenchido.id}, checklistId: ${checklistPreenchido.checklistId}`);
        this.logger.log(`📝 [PENDENCIA-UUID] Total respostas encontradas: ${checklistPreenchido.ChecklistResposta.length}`);

        checklistPreenchido.ChecklistResposta.forEach((resp, idx) => {
          this.logger.log(`📝 [PENDENCIA-UUID] Resposta ${idx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`);
        });
      }

      if (!checklistPreenchido) {
        this.logger.warn(
          `❌ [PENDENCIA-UUID] Checklist preenchido não encontrado: turnoId=${turnoId}, checklistUuid=${checklistUuid}`
        );
        return;
      }

      const resposta = checklistPreenchido.ChecklistResposta[0];
      if (!resposta) {
        this.logger.warn(
          `❌ [PENDENCIA-UUID] Resposta não encontrada: turnoId=${turnoId}, checklistUuid=${checklistUuid}, perguntaId=${perguntaId}`
        );
        return;
      }

      this.logger.log(`✅ [PENDENCIA-UUID] Resposta encontrada: ID=${resposta.id}`);

      // Buscar a pendência relacionada à resposta
      const pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.warn(
          `❌ [PENDENCIA-UUID] Pendência não encontrada para resposta: checklistRespostaId=${resposta.id}`
        );
        return;
      }

      this.logger.log(`✅ [PENDENCIA-UUID] Pendência encontrada: ID=${pendencia.id}`);

      // Buscar a foto mobile salva
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(`❌ [PENDENCIA-UUID] Foto mobile não encontrada: id=${mobilePhotoId}`);
        return;
      }

      this.logger.log(`✅ [PENDENCIA-UUID] Foto mobile encontrada: ID=${mobilePhoto.id}, URL=${mobilePhoto.url}`);

      // Criar registro na tabela ChecklistRespostaFoto
      const checklistRespostaFoto = await this.db.getPrisma().checklistRespostaFoto.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPendenciaId: pendencia.id,
          caminhoArquivo: mobilePhoto.storagePath,
          urlPublica: mobilePhoto.url,
          tamanhoBytes: BigInt(mobilePhoto.fileSize),
          mimeType: mobilePhoto.mimeType,
          sincronizadoEm: new Date(),
          metadados: {
            mobilePhotoId: mobilePhoto.id,
            tipo: mobilePhoto.tipo,
            capturedAt: mobilePhoto.capturedAt,
            turnoId,
            checklistUuid,
            perguntaId,
          },
          createdAt: new Date(),
          createdBy: 'system',
        },
      });

      this.logger.log(`✅ [PENDENCIA-UUID] ChecklistRespostaFoto criada: ID=${checklistRespostaFoto.id}`);

      // Incrementar contador de fotos na resposta e marcar como não aguardando mais foto
      await this.db.getPrisma().checklistResposta.update({
        where: { id: resposta.id },
        data: {
          fotosSincronizadas: {
            increment: 1,
          },
          aguardandoFoto: false, // ✅ Marcar como foto já sincronizada
          updatedAt: new Date(),
          updatedBy: 'system',
        },
      });

      this.logger.log(
        `✅ [PENDENCIA-UUID] Foto de pendência processada com sucesso: pendenciaId=${pendencia.id}, checklistRespostaId=${resposta.id}`
      );

      // Debug: Verificar se a foto foi salva
      const fotoVerificacao = await this.db.getPrisma().checklistRespostaFoto.findFirst({
        where: { checklistRespostaId: resposta.id },
        orderBy: { createdAt: 'desc' }
      });

      if (fotoVerificacao) {
        this.logger.log(`✅ [PENDENCIA-UUID] Foto confirmada salva - ID: ${fotoVerificacao.id}, checklistRespostaId: ${fotoVerificacao.checklistRespostaId}`);
      } else {
        this.logger.error(`❌ [PENDENCIA-UUID] Foto NÃO encontrada após salvar!`);
      }
    } catch (error) {
      this.logger.error(
        `❌ [PENDENCIA-UUID] Erro ao processar foto de pendência: ${error}`,
        error
      );
    }
  }

  /**
   * Processa foto de pendência usando combinação turnoId + perguntaId + opcaoRespostaId
   * @deprecated Use processarFotoPendenciaComUuid em vez deste método
   */
  private async processarFotoPendenciaComMapeamento(
    mobilePhotoId: number,
    turnoId: number,
    checklistPreenchidoId: number,
    perguntaId: number,
    opcaoRespostaId: number
  ): Promise<void> {
    try {
      this.logger.log(
        `🔄 [PENDENCIA] Processando foto de pendência: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}, perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
      );

      // Primeiro, verificar se o turno existe
      const turno = await this.db.getPrisma().turno.findUnique({
        where: { id: turnoId },
        select: { id: true, dataInicio: true }
      });

      if (!turno) {
        this.logger.error(`❌ [PENDENCIA] Turno não encontrado: turnoId=${turnoId}`);
        return;
      }

      this.logger.log(`✅ [PENDENCIA] Turno encontrado: ${turno.id}, dataInicio: ${turno.dataInicio}`);

      // Buscar checklist preenchido no turno
      // Primeiro, buscar todos os checklists do turno para debug
      const todosChecklists = await this.db.getPrisma().checklistPreenchido.findMany({
        where: { turnoId },
        include: {
          ChecklistResposta: {
            include: { ChecklistPendencia: true }
          }
        }
      });

      this.logger.log(`🔍 [PENDENCIA] Total checklists no turno ${turnoId}: ${todosChecklists.length}`);

      todosChecklists.forEach((checklist, idx) => {
        this.logger.log(`📋 [PENDENCIA] Checklist ${idx + 1} - ID: ${checklist.id}, checklistId: ${checklist.checklistId}, respostas: ${checklist.ChecklistResposta.length}`);
        checklist.ChecklistResposta.forEach((resp, respIdx) => {
          this.logger.log(`📝 [PENDENCIA]   Resposta ${respIdx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`);
        });
      });

      // Buscar especificamente pela resposta com os IDs fornecidos
      this.logger.log(`🔍 [PENDENCIA] Buscando resposta específica: perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`);

      const checklistPreenchido = await this.db.getPrisma().checklistPreenchido.findFirst({
        where: {
          turnoId,
        },
        include: {
          ChecklistResposta: {
            where: {
              perguntaId,
              opcaoRespostaId
            },
            include: {
              ChecklistPendencia: true,
            },
          },
        },
      });

      this.logger.log(`🔍 [PENDENCIA] Checklist específico encontrado: ${checklistPreenchido ? 'SIM' : 'NÃO'}`);

      if (checklistPreenchido) {
        this.logger.log(`📋 [PENDENCIA] Checklist ID: ${checklistPreenchido.id}, checklistId: ${checklistPreenchido.checklistId}`);
        this.logger.log(`📝 [PENDENCIA] Total respostas específicas encontradas: ${checklistPreenchido.ChecklistResposta.length}`);

        checklistPreenchido.ChecklistResposta.forEach((resp, idx) => {
          this.logger.log(`📝 [PENDENCIA] Resposta específica ${idx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`);
        });
      }

      if (!checklistPreenchido) {
        this.logger.warn(
          `❌ [PENDENCIA] Checklist preenchido não encontrado: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}`
        );
        return;
      }

      const resposta = checklistPreenchido.ChecklistResposta[0];
      if (!resposta) {
        this.logger.warn(
          `❌ [PENDENCIA] Resposta não encontrada: turnoId=${turnoId}, perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
        );
        return;
      }

      this.logger.log(`✅ [PENDENCIA] Resposta encontrada: ID=${resposta.id}`);

      // Buscar a pendência relacionada à resposta
      const pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.warn(
          `❌ [PENDENCIA] Pendência não encontrada para resposta: checklistRespostaId=${resposta.id}`
        );
        return;
      }

      this.logger.log(`✅ [PENDENCIA] Pendência encontrada: ID=${pendencia.id}`);

      // Buscar a foto mobile salva
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(`❌ [PENDENCIA] Foto mobile não encontrada: id=${mobilePhotoId}`);
        return;
      }

      this.logger.log(`✅ [PENDENCIA] Foto mobile encontrada: ID=${mobilePhoto.id}, URL=${mobilePhoto.url}`);

      // Criar registro na tabela ChecklistRespostaFoto
      await this.db.getPrisma().checklistRespostaFoto.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPendenciaId: pendencia.id,
          caminhoArquivo: mobilePhoto.storagePath,
          urlPublica: mobilePhoto.url,
          tamanhoBytes: BigInt(mobilePhoto.fileSize),
          mimeType: mobilePhoto.mimeType,
          sincronizadoEm: new Date(),
          metadados: {
            mobilePhotoId: mobilePhoto.id,
            tipo: mobilePhoto.tipo,
            capturedAt: mobilePhoto.capturedAt,
            turnoId,
            checklistPreenchidoIdLocal: checklistPreenchidoId,
            perguntaId,
            opcaoRespostaId,
          },
          createdAt: new Date(),
          createdBy: 'system',
        },
      });

      // Incrementar contador de fotos na resposta e marcar como não aguardando mais foto
      await this.db.getPrisma().checklistResposta.update({
        where: { id: resposta.id },
        data: {
          fotosSincronizadas: {
            increment: 1,
          },
          aguardandoFoto: false, // ✅ Marcar como foto já sincronizada
          updatedAt: new Date(),
          updatedBy: 'system',
        },
      });

      this.logger.log(
        `✅ [PENDENCIA] Foto de pendência processada com sucesso: pendenciaId=${pendencia.id}, checklistRespostaId=${resposta.id}`
      );

      // Debug: Verificar se a foto foi salva
      const fotoVerificacao = await this.db.getPrisma().checklistRespostaFoto.findFirst({
        where: { checklistRespostaId: resposta.id },
        orderBy: { createdAt: 'desc' }
      });

      if (fotoVerificacao) {
        this.logger.log(`✅ [PENDENCIA] Foto confirmada salva - ID: ${fotoVerificacao.id}, checklistRespostaId: ${fotoVerificacao.checklistRespostaId}`);
      } else {
        this.logger.error(`❌ [PENDENCIA] Foto NÃO encontrada após salvar!`);
      }
    } catch (error) {
      this.logger.error(
        `❌ [PENDENCIA] Erro ao processar foto de pendência: ${error}`,
        error
      );
    }
  }
}
