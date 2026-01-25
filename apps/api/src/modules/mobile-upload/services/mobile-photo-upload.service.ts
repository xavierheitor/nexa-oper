/**
 * Serviço responsável por processar uploads de fotos enviados pelo aplicativo mobile.
 */

import { randomUUID, createHash } from 'crypto';
import { extname, join } from 'path';

import { createAuditData, getDefaultUserContext } from '@common/utils/audit';
import { sanitizeData } from '@common/utils/logger';
import {
  ALLOWED_MOBILE_PHOTO_MIME_TYPES,
  MAX_MOBILE_PHOTO_FILE_SIZE,
  MOBILE_PHOTO_UPLOAD_ROOT,
  SUPPORTED_MOBILE_PHOTO_TYPES,
} from '@common/constants/mobile-upload';
import { StoragePort } from '@common/storage/storage.port';
import { STORAGE_PORT } from '@common/storage/storage.port';
import { DatabaseService } from '@database/database.service';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PhotoUploadDto, PhotoUploadResponseDto } from '../dto';

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

  constructor(
    private readonly db: DatabaseService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort
  ) {}

  /**
   * Processa o upload de uma foto recebida do aplicativo mobile.
   */
  async handleUpload(
    file: MulterFile | undefined,
    payload: PhotoUploadDto,
    userId?: string
  ): Promise<PhotoUploadResponseDto> {
    this.logger.debug(
      `[UPLOAD] Iniciando upload - tipo: ${payload.tipo}, turnoId: ${payload.turnoId}`
    );
    // Sanitiza payload para evitar exposição de informações sensíveis
    this.logger.debug(
      `[UPLOAD] Payload completo:`,
      JSON.stringify(sanitizeData(payload), null, 2)
    );

    if (!file) {
      throw new BadRequestException('Arquivo da foto é obrigatório');
    }

    // ✅ Validação: Rejeitar fotos de checklist sem UUID
    if (
      (payload.tipo === 'checklistReprova' || payload.tipo === 'assinatura') &&
      (!payload.checklistUuid || payload.checklistUuid.trim() === '')
    ) {
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
    const key = relativePath.urlPath;

    await this.storage.put({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    const absolutePath = join(MOBILE_PHOTO_UPLOAD_ROOT, ...relativePath.parts);

    // Montar path relativo para o banco (sem URL base, apenas /mobile/photos/...)
    const relativeUrlPath = `/mobile/photos/${relativePath.urlPath}`;

    const audit = createAuditData(
      userId ? { userId, userName: userId, roles: ['mobile'] } : getDefaultUserContext()
    );

    let mobilePhoto;
    try {
      mobilePhoto = await this.db.getPrisma().mobilePhoto.create({
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
          url: relativeUrlPath,
          capturedAt: new Date(),
          ...audit,
        },
      });
    } catch (err: unknown) {
      try {
        await this.storage.delete(key);
      } catch (deleteErr) {
        this.logger.warn(
          `[UPLOAD] Falha ao remover arquivo órfão após erro no create: ${key}`,
          deleteErr
        );
      }
      const e = err as { code?: string };
      if (e?.code === 'P2002') {
        const existing = await this.db
          .getPrisma()
          .mobilePhoto.findUnique({ where: { checksum } });
        if (existing) {
          return {
            status: 'duplicate',
            url: existing.url,
            checksum: existing.checksum,
          };
        }
      }
      throw err;
    }

    this.logger.debug(
      `[UPLOAD] Foto mobile salva - ID: ${mobilePhoto.id}, tipo: ${mobilePhoto.tipo}`
    );

    // Processar foto de pendência se aplicável
    const shouldProcessPendencia =
      (payload.tipo === 'pendencia' || payload.tipo === 'checklistReprova') &&
      payload.checklistPerguntaId;

    this.logger.debug(
      `[UPLOAD] Deve processar pendência? ${shouldProcessPendencia}`
    );
    this.logger.debug(
      `[UPLOAD] Condições: tipo=${payload.tipo}, checklistUuid=${payload.checklistUuid}, checklistPerguntaId=${payload.checklistPerguntaId}`
    );

    if (shouldProcessPendencia) {
      this.logger.debug(`[UPLOAD] Iniciando processamento de pendência...`);

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
      this.logger.debug(`[UPLOAD] Pulando processamento de pendência`);
    }

    this.logger.log(
      `Foto armazenada com sucesso: turno ${payload.turnoId} - ${relativePath.fileName}`
    );

    const fullUrl = this.storage.getPublicUrl(key);

    return {
      status: 'stored',
      url: fullUrl,
      checksum,
    };
  }

  /**
   * Garante que o arquivo está dentro dos limites aceitos.
   */
  private validateFile(file: MulterFile): void {
    if (file.size > MAX_MOBILE_PHOTO_FILE_SIZE) {
      throw new BadRequestException(
        'Arquivo excede o tamanho máximo permitido'
      );
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
  private buildRelativePath(
    turnoId: number,
    extension: string
  ): {
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
      this.logger.debug(
        `[PENDENCIA-SEM-UUID] Processando foto de pendência: turnoId=${turnoId}, perguntaId=${perguntaId}`
      );

      // Buscar a foto mobile
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA-SEM-UUID] Foto mobile não encontrada: ${mobilePhotoId}`
        );
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

      this.logger.debug(
        `[PENDENCIA-SEM-UUID] Encontradas ${respostas.length} respostas para perguntaId=${perguntaId} no turnoId=${turnoId}`
      );

      if (respostas.length === 0) {
        this.logger.warn(
          `[PENDENCIA-SEM-UUID] Nenhuma resposta encontrada para perguntaId=${perguntaId} no turnoId=${turnoId}`
        );
        return;
      }

      // Processar cada resposta encontrada
      for (const resposta of respostas) {
        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Processando resposta ID: ${resposta.id}`
        );

        // Buscar ou criar pendência
        let pendencia = resposta.ChecklistPendencia;
        if (!pendencia) {
          this.logger.debug(
            `[PENDENCIA-SEM-UUID] Criando nova pendência para resposta ${resposta.id}`
          );

          try {
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
          } catch (error: any) {
            // Tratar race condition: se outra requisição criou a pendência simultaneamente
            if (
              error?.code === 'P2002' &&
              error?.meta?.target?.includes('checklistRespostaId')
            ) {
              this.logger.debug(
                `[PENDENCIA-SEM-UUID] Pendência já existe (race condition), buscando novamente: checklistRespostaId=${resposta.id}`
              );

              // Buscar a pendência que foi criada pela outra requisição
              pendencia = await this.db
                .getPrisma()
                .checklistPendencia.findUnique({
                  where: { checklistRespostaId: resposta.id },
                });

              if (!pendencia) {
                this.logger.error(
                  `[PENDENCIA-SEM-UUID] Erro ao buscar pendência após race condition: checklistRespostaId=${resposta.id}`
                );
                continue; // Pular para próxima resposta
              }

              this.logger.debug(
                `[PENDENCIA-SEM-UUID] Pendência encontrada após race condition: ID=${pendencia.id}`
              );
            } else {
              // Re-lançar erro se não for race condition
              this.logger.error(
                `[PENDENCIA-SEM-UUID] Erro ao criar pendência: ${error}`,
                error
              );
              throw error;
            }
          }
        }

        // Criar registro na tabela ChecklistRespostaFoto
        const checklistRespostaFoto = await this.db
          .getPrisma()
          .checklistRespostaFoto.create({
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

        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Foto vinculada com sucesso - RespostaFoto ID: ${checklistRespostaFoto.id}, Resposta ID: ${resposta.id}, Pendência ID: ${pendencia.id}`
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

        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Contador de fotos atualizado para resposta ${resposta.id}`
        );
      }

      this.logger.debug(
        `[PENDENCIA-SEM-UUID] Processamento concluído para ${respostas.length} resposta(s)`
      );
    } catch (error) {
      this.logger.error(
        `[PENDENCIA-SEM-UUID] Erro ao processar foto de pendência: ${error}`,
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
      this.logger.debug(
        `[PENDENCIA-UUID] Processando foto de pendência: turnoId=${turnoId}, checklistUuid=${checklistUuid}, perguntaId=${perguntaId}`
      );

      // Primeiro, verificar se o turno existe
      const turno = await this.db.getPrisma().turno.findUnique({
        where: { id: turnoId },
        select: { id: true, dataInicio: true },
      });

      if (!turno) {
        this.logger.error(
          `[PENDENCIA-UUID] Turno não encontrado: turnoId=${turnoId}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA-UUID] Turno encontrado: ${turno.id}, dataInicio: ${turno.dataInicio}`
      );

      // Buscar o checklist preenchido pelo UUID
      const checklistPreenchido = await this.db
        .getPrisma()
        .checklistPreenchido.findFirst({
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

      this.logger.debug(
        `[PENDENCIA-UUID] Checklist encontrado pelo UUID: ${checklistPreenchido ? 'SIM' : 'NÃO'}`
      );

      if (checklistPreenchido) {
        this.logger.debug(
          `[PENDENCIA-UUID] Checklist ID: ${checklistPreenchido.id}, checklistId: ${checklistPreenchido.checklistId}`
        );
        this.logger.debug(
          `[PENDENCIA-UUID] Total respostas encontradas: ${checklistPreenchido.ChecklistResposta.length}`
        );

        checklistPreenchido.ChecklistResposta.forEach((resp, idx) => {
          this.logger.debug(
            `[PENDENCIA-UUID] Resposta ${idx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`
          );
        });
      }

      if (!checklistPreenchido) {
        this.logger.warn(
          `[PENDENCIA-UUID] Checklist preenchido não encontrado: turnoId=${turnoId}, checklistUuid=${checklistUuid}`
        );
        return;
      }

      const resposta = checklistPreenchido.ChecklistResposta[0];
      if (!resposta) {
        this.logger.warn(
          `[PENDENCIA-UUID] Resposta não encontrada: turnoId=${turnoId}, checklistUuid=${checklistUuid}, perguntaId=${perguntaId}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA-UUID] Resposta encontrada: ID=${resposta.id}`
      );

      // Buscar ou criar pendência relacionada à resposta
      let pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.debug(
          `[PENDENCIA-UUID] Pendência não encontrada, criando nova para resposta: checklistRespostaId=${resposta.id}`
        );

        try {
          // Criar pendência para reprovação
          pendencia = await this.db.getPrisma().checklistPendencia.create({
            data: {
              checklistRespostaId: resposta.id,
              checklistPreenchidoId: resposta.checklistPreenchidoId,
              turnoId: checklistPreenchido.turnoId,
              status: 'AGUARDANDO_TRATAMENTO',
              observacaoProblema:
                'Pendência criada a partir de foto de reprovação',
              createdAt: new Date(),
              createdBy: 'system',
            },
          });

          this.logger.debug(
            `[PENDENCIA-UUID] Pendência criada: ID=${pendencia.id}, checklistRespostaId=${resposta.id}`
          );
        } catch (error: any) {
          // Tratar race condition: se outra requisição criou a pendência simultaneamente
          if (
            error?.code === 'P2002' &&
            error?.meta?.target?.includes('checklistRespostaId')
          ) {
            this.logger.debug(
              `[PENDENCIA-UUID] Pendência já existe (race condition), buscando novamente: checklistRespostaId=${resposta.id}`
            );

            // Buscar a pendência que foi criada pela outra requisição
            pendencia = await this.db
              .getPrisma()
              .checklistPendencia.findUnique({
                where: { checklistRespostaId: resposta.id },
              });

            if (!pendencia) {
              this.logger.error(
                `[PENDENCIA-UUID] Erro ao buscar pendência após race condition: checklistRespostaId=${resposta.id}`
              );
              return;
            }

            this.logger.debug(
              `[PENDENCIA-UUID] Pendência encontrada após race condition: ID=${pendencia.id}`
            );
          } else {
            // Re-lançar erro se não for race condition
            this.logger.error(
              `[PENDENCIA-UUID] Erro ao criar pendência: ${error}`,
              error
            );
            throw error;
          }
        }
      } else {
        this.logger.debug(
          `[PENDENCIA-UUID] Pendência encontrada: ID=${pendencia.id}`
        );
      }

      // Buscar a foto mobile salva
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA-UUID] Foto mobile não encontrada: id=${mobilePhotoId}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA-UUID] Foto mobile encontrada: ID=${mobilePhoto.id}, URL=${mobilePhoto.url}`
      );

      // Criar registro na tabela ChecklistRespostaFoto
      const checklistRespostaFoto = await this.db
        .getPrisma()
        .checklistRespostaFoto.create({
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

      this.logger.debug(
        `[PENDENCIA-UUID] ChecklistRespostaFoto criada: ID=${checklistRespostaFoto.id}`
      );

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

      this.logger.debug(
        `[PENDENCIA-UUID] Foto de pendência processada com sucesso: pendenciaId=${pendencia.id}, checklistRespostaId=${resposta.id}`
      );

      // Debug: Verificar se a foto foi salva
      const fotoVerificacao = await this.db
        .getPrisma()
        .checklistRespostaFoto.findFirst({
          where: { checklistRespostaId: resposta.id },
          orderBy: { createdAt: 'desc' },
        });

      if (fotoVerificacao) {
        this.logger.debug(
          `[PENDENCIA-UUID] Foto confirmada salva - ID: ${fotoVerificacao.id}, checklistRespostaId: ${fotoVerificacao.checklistRespostaId}`
        );
      } else {
        this.logger.error(`[PENDENCIA-UUID] Foto NÃO encontrada após salvar!`);
      }
    } catch (error) {
      this.logger.error(
        `[PENDENCIA-UUID] Erro ao processar foto de pendência: ${error}`,
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
      this.logger.debug(
        `[PENDENCIA] Processando foto de pendência: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}, perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
      );

      // Primeiro, verificar se o turno existe
      const turno = await this.db.getPrisma().turno.findUnique({
        where: { id: turnoId },
        select: { id: true, dataInicio: true },
      });

      if (!turno) {
        this.logger.error(
          `[PENDENCIA] Turno não encontrado: turnoId=${turnoId}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA] Turno encontrado: ${turno.id}, dataInicio: ${turno.dataInicio}`
      );

      // Buscar checklist preenchido no turno
      // Primeiro, buscar todos os checklists do turno para debug
      const todosChecklists = await this.db
        .getPrisma()
        .checklistPreenchido.findMany({
          where: { turnoId },
          include: {
            ChecklistResposta: {
              include: { ChecklistPendencia: true },
            },
          },
        });

      this.logger.debug(
        `[PENDENCIA] Total checklists no turno ${turnoId}: ${todosChecklists.length}`
      );

      todosChecklists.forEach((checklist, idx) => {
        this.logger.debug(
          `[PENDENCIA] Checklist ${idx + 1} - ID: ${checklist.id}, checklistId: ${checklist.checklistId}, respostas: ${checklist.ChecklistResposta.length}`
        );
        checklist.ChecklistResposta.forEach((resp, respIdx) => {
          this.logger.debug(
            `[PENDENCIA]   Resposta ${respIdx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`
          );
        });
      });

      // Buscar especificamente pela resposta com os IDs fornecidos
      this.logger.debug(
        `[PENDENCIA] Buscando resposta específica: perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
      );

      const checklistPreenchido = await this.db
        .getPrisma()
        .checklistPreenchido.findFirst({
          where: {
            turnoId,
          },
          include: {
            ChecklistResposta: {
              where: {
                perguntaId,
                opcaoRespostaId,
              },
              include: {
                ChecklistPendencia: true,
              },
            },
          },
        });

      this.logger.debug(
        `[PENDENCIA] Checklist específico encontrado: ${checklistPreenchido ? 'SIM' : 'NÃO'}`
      );

      if (checklistPreenchido) {
        this.logger.debug(
          `[PENDENCIA] Checklist ID: ${checklistPreenchido.id}, checklistId: ${checklistPreenchido.checklistId}`
        );
        this.logger.debug(
          `[PENDENCIA] Total respostas específicas encontradas: ${checklistPreenchido.ChecklistResposta.length}`
        );

        checklistPreenchido.ChecklistResposta.forEach((resp, idx) => {
          this.logger.debug(
            `[PENDENCIA] Resposta específica ${idx + 1} - ID: ${resp.id}, perguntaId: ${resp.perguntaId}, opcaoRespostaId: ${resp.opcaoRespostaId}, temPendencia: ${!!resp.ChecklistPendencia}`
          );
        });
      }

      if (!checklistPreenchido) {
        this.logger.warn(
          `[PENDENCIA] Checklist preenchido não encontrado: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}`
        );
        return;
      }

      const resposta = checklistPreenchido.ChecklistResposta[0];
      if (!resposta) {
        this.logger.warn(
          `[PENDENCIA] Resposta não encontrada: turnoId=${turnoId}, perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
        );
        return;
      }

      this.logger.debug(`[PENDENCIA] Resposta encontrada: ID=${resposta.id}`);

      // Buscar a pendência relacionada à resposta
      const pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.warn(
          `[PENDENCIA] Pendência não encontrada para resposta: checklistRespostaId=${resposta.id}`
        );
        return;
      }

      this.logger.debug(`[PENDENCIA] Pendência encontrada: ID=${pendencia.id}`);

      // Buscar a foto mobile salva
      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });

      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA] Foto mobile não encontrada: id=${mobilePhotoId}`
        );
        return;
      }

      this.logger.debug(
        `[PENDENCIA] Foto mobile encontrada: ID=${mobilePhoto.id}, URL=${mobilePhoto.url}`
      );

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

      this.logger.debug(
        `[PENDENCIA] Foto de pendência processada com sucesso: pendenciaId=${pendencia.id}, checklistRespostaId=${resposta.id}`
      );

      // Debug: Verificar se a foto foi salva
      const fotoVerificacao = await this.db
        .getPrisma()
        .checklistRespostaFoto.findFirst({
          where: { checklistRespostaId: resposta.id },
          orderBy: { createdAt: 'desc' },
        });

      if (fotoVerificacao) {
        this.logger.debug(
          `[PENDENCIA] Foto confirmada salva - ID: ${fotoVerificacao.id}, checklistRespostaId: ${fotoVerificacao.checklistRespostaId}`
        );
      } else {
        this.logger.error(`[PENDENCIA] Foto NÃO encontrada após salvar!`);
      }
    } catch (error) {
      this.logger.error(
        `[PENDENCIA] Erro ao processar foto de pendência: ${error}`,
        error
      );
    }
  }
}
