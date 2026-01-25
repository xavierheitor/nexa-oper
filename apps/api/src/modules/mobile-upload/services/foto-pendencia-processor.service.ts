/**
 * Processa vínculo de fotos mobile com pendências de checklist.
 * Extraído de MobilePhotoUploadService para reduzir tamanho do arquivo.
 */

import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FotoPendenciaProcessorService {
  private readonly logger = new Logger(FotoPendenciaProcessorService.name);

  constructor(private readonly db: DatabaseService) {}

  async processarSemUuid(
    mobilePhotoId: number,
    turnoId: number,
    perguntaId: number
  ): Promise<void> {
    try {
      this.logger.debug(
        `[PENDENCIA-SEM-UUID] Processando foto de pendência: turnoId=${turnoId}, perguntaId=${perguntaId}`
      );

      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });
      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA-SEM-UUID] Foto mobile não encontrada: ${mobilePhotoId}`
        );
        return;
      }

      const respostas = await this.db.getPrisma().checklistResposta.findMany({
        where: {
          perguntaId,
          checklistPreenchido: { turnoId, deletedAt: null },
          deletedAt: null,
        },
        include: { ChecklistPendencia: true },
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

      for (const resposta of respostas) {
        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Processando resposta ID: ${resposta.id}`
        );
        const pendencia = await this.obterOuCriarPendenciaSemUuid(
          resposta,
          turnoId
        );
        if (!pendencia) continue;
        await this.vincularFotoARespostaPendenciaSemUuid(
          resposta.id,
          pendencia.id,
          mobilePhoto,
          perguntaId,
          turnoId
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

  private async obterOuCriarPendenciaSemUuid(
    resposta: {
      id: number;
      checklistPreenchidoId: number;
      ChecklistPendencia: { id: number } | null;
    },
    turnoId: number
  ): Promise<{ id: number } | null> {
    if (resposta.ChecklistPendencia) return resposta.ChecklistPendencia;

    this.logger.debug(
      `[PENDENCIA-SEM-UUID] Criando nova pendência para resposta ${resposta.id}`
    );
    try {
      return await this.db.getPrisma().checklistPendencia.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPreenchidoId: resposta.checklistPreenchidoId,
          turnoId,
          status: 'AGUARDANDO_TRATAMENTO',
          createdAt: new Date(),
          createdBy: 'system',
        },
      });
    } catch (error: unknown) {
      const e = error as { code?: string; meta?: { target?: string[] } };
      if (
        e?.code === 'P2002' &&
        e?.meta?.target?.includes('checklistRespostaId')
      ) {
        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Pendência já existe (race condition), buscando: checklistRespostaId=${resposta.id}`
        );
        const pendencia = await this.db
          .getPrisma()
          .checklistPendencia.findUnique({
            where: { checklistRespostaId: resposta.id },
          });
        if (!pendencia) {
          this.logger.error(
            `[PENDENCIA-SEM-UUID] Erro ao buscar pendência após race: checklistRespostaId=${resposta.id}`
          );
          return null;
        }
        this.logger.debug(
          `[PENDENCIA-SEM-UUID] Pendência encontrada após race: ID=${pendencia.id}`
        );
        return pendencia;
      }
      this.logger.error(`[PENDENCIA-SEM-UUID] Erro ao criar pendência:`, e);
      throw error;
    }
  }

  private async vincularFotoARespostaPendenciaSemUuid(
    checklistRespostaId: number,
    checklistPendenciaId: number,
    mobilePhoto: {
      id: number;
      storagePath: string;
      url: string;
      fileSize: number;
      mimeType: string;
      tipo: string;
      capturedAt: Date | null;
    },
    perguntaId: number,
    turnoId: number
  ): Promise<void> {
    const checklistRespostaFoto = await this.db
      .getPrisma()
      .checklistRespostaFoto.create({
        data: {
          checklistRespostaId,
          checklistPendenciaId,
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
      `[PENDENCIA-SEM-UUID] Foto vinculada - RespostaFoto ID: ${checklistRespostaFoto.id}, Resposta ID: ${checklistRespostaId}, Pendência ID: ${checklistPendenciaId}`
    );

    await this.db.getPrisma().checklistResposta.update({
      where: { id: checklistRespostaId },
      data: {
        fotosSincronizadas: { increment: 1 },
        aguardandoFoto: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    });
    this.logger.debug(
      `[PENDENCIA-SEM-UUID] Contador de fotos atualizado para resposta ${checklistRespostaId}`
    );
  }

  /**
   * Processa foto de pendência usando UUID do checklist preenchido
   */
  async processarComUuid(
    mobilePhotoId: number,
    turnoId: number,
    checklistUuid: string,
    perguntaId: number
  ): Promise<void> {
    try {
      this.logger.debug(
        `[PENDENCIA-UUID] Processando: turnoId=${turnoId}, checklistUuid=${checklistUuid}, perguntaId=${perguntaId}`
      );

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

      const checklistPreenchido = await this.db
        .getPrisma()
        .checklistPreenchido.findFirst({
          where: { uuid: checklistUuid, turnoId },
          include: {
            ChecklistResposta: {
              where: { perguntaId },
              include: { ChecklistPendencia: true },
            },
          },
        });

      if (!checklistPreenchido) {
        this.logger.warn(
          `[PENDENCIA-UUID] Checklist não encontrado: turnoId=${turnoId}, checklistUuid=${checklistUuid}`
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

      let pendencia: { id: number } | null = resposta.ChecklistPendencia
        ? { id: resposta.ChecklistPendencia.id }
        : null;
      if (!pendencia) {
        pendencia = await this.obterOuCriarPendenciaComUuid(
          resposta,
          checklistPreenchido.turnoId
        );
        if (!pendencia) return;
      }

      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });
      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA-UUID] Foto mobile não encontrada: id=${mobilePhotoId}`
        );
        return;
      }

      await this.vincularFotoPendenciaComUuid(
        resposta.id,
        pendencia.id,
        mobilePhoto,
        turnoId,
        checklistUuid,
        perguntaId
      );
    } catch (error) {
      this.logger.error(
        `[PENDENCIA-UUID] Erro ao processar foto de pendência: ${error}`,
        error
      );
    }
  }

  private async obterOuCriarPendenciaComUuid(
    resposta: { id: number; checklistPreenchidoId: number },
    turnoId: number
  ): Promise<{ id: number } | null> {
    this.logger.debug(
      `[PENDENCIA-UUID] Criando nova pendência: checklistRespostaId=${resposta.id}`
    );
    try {
      return await this.db.getPrisma().checklistPendencia.create({
        data: {
          checklistRespostaId: resposta.id,
          checklistPreenchidoId: resposta.checklistPreenchidoId,
          turnoId,
          status: 'AGUARDANDO_TRATAMENTO',
          observacaoProblema: 'Pendência criada a partir de foto de reprovação',
          createdAt: new Date(),
          createdBy: 'system',
        },
      });
    } catch (error: unknown) {
      const e = error as { code?: string; meta?: { target?: string[] } };
      if (
        e?.code === 'P2002' &&
        e?.meta?.target?.includes('checklistRespostaId')
      ) {
        const pendencia = await this.db
          .getPrisma()
          .checklistPendencia.findUnique({
            where: { checklistRespostaId: resposta.id },
          });
        if (!pendencia) {
          this.logger.error(
            `[PENDENCIA-UUID] Erro ao buscar pendência após race: checklistRespostaId=${resposta.id}`
          );
          return null;
        }
        return pendencia;
      }
      this.logger.error(`[PENDENCIA-UUID] Erro ao criar pendência:`, e);
      throw error;
    }
  }

  private async vincularFotoPendenciaComUuid(
    checklistRespostaId: number,
    checklistPendenciaId: number,
    mobilePhoto: {
      id: number;
      storagePath: string;
      url: string;
      fileSize: number;
      mimeType: string;
      tipo: string;
      capturedAt: Date | null;
    },
    turnoId: number,
    checklistUuid: string,
    perguntaId: number
  ): Promise<void> {
    await this.db.getPrisma().checklistRespostaFoto.create({
      data: {
        checklistRespostaId,
        checklistPendenciaId,
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
    await this.db.getPrisma().checklistResposta.update({
      where: { id: checklistRespostaId },
      data: {
        fotosSincronizadas: { increment: 1 },
        aguardandoFoto: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    });
  }

  /**
   * Processa foto de pendência usando turnoId + perguntaId + opcaoRespostaId.
   * @deprecated Use processarComUuid em vez deste método
   */
  async processarComMapeamento(
    mobilePhotoId: number,
    turnoId: number,
    checklistPreenchidoId: number,
    perguntaId: number,
    opcaoRespostaId: number
  ): Promise<void> {
    try {
      this.logger.debug(
        `[PENDENCIA] Processando: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}, perguntaId=${perguntaId}, opcaoRespostaId=${opcaoRespostaId}`
      );

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

      const checklistPreenchido = await this.db
        .getPrisma()
        .checklistPreenchido.findFirst({
          where: { turnoId },
          include: {
            ChecklistResposta: {
              where: { perguntaId, opcaoRespostaId },
              include: { ChecklistPendencia: true },
            },
          },
        });

      if (!checklistPreenchido) {
        this.logger.warn(
          `[PENDENCIA] Checklist não encontrado: turnoId=${turnoId}, checklistPreenchidoId=${checklistPreenchidoId}`
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

      const pendencia = resposta.ChecklistPendencia;
      if (!pendencia) {
        this.logger.warn(
          `[PENDENCIA] Pendência não encontrada: checklistRespostaId=${resposta.id}`
        );
        return;
      }

      const mobilePhoto = await this.db.getPrisma().mobilePhoto.findUnique({
        where: { id: mobilePhotoId },
      });
      if (!mobilePhoto) {
        this.logger.error(
          `[PENDENCIA] Foto mobile não encontrada: id=${mobilePhotoId}`
        );
        return;
      }

      await this.vincularFotoPendenciaComMapeamento(
        resposta.id,
        pendencia.id,
        mobilePhoto,
        turnoId,
        checklistPreenchidoId,
        perguntaId,
        opcaoRespostaId
      );
      this.logger.debug(
        `[PENDENCIA] Processado: pendenciaId=${pendencia.id}, checklistRespostaId=${resposta.id}`
      );
    } catch (error) {
      this.logger.error(`[PENDENCIA] Erro ao processar: ${error}`, error);
    }
  }

  private async vincularFotoPendenciaComMapeamento(
    checklistRespostaId: number,
    checklistPendenciaId: number,
    mobilePhoto: {
      id: number;
      storagePath: string;
      url: string;
      fileSize: number;
      mimeType: string;
      tipo: string;
      capturedAt: Date | null;
    },
    turnoId: number,
    checklistPreenchidoId: number,
    perguntaId: number,
    opcaoRespostaId: number
  ): Promise<void> {
    await this.db.getPrisma().checklistRespostaFoto.create({
      data: {
        checklistRespostaId,
        checklistPendenciaId,
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
    await this.db.getPrisma().checklistResposta.update({
      where: { id: checklistRespostaId },
      data: {
        fotosSincronizadas: { increment: 1 },
        aguardandoFoto: false,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    });
  }
}
