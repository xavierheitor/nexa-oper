/**
 * Serviço para gerenciar fotos de checklist
 *
 * Este serviço é responsável por sincronizar fotos de forma assíncrona,
 * gerenciar storage e gerar URLs públicas para acesso às fotos.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import {
  SincronizarFotoDto,
  FotoResponseDto,
  ListarFotosRespostaDto,
  ListarFotosPendenciaDto,
} from '../dto';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ChecklistFotoService {
  private readonly logger = new Logger(ChecklistFotoService.name);
  private readonly uploadsPath = join(process.cwd(), 'uploads', 'checklists');

  constructor(private readonly db: DatabaseService) {
    // Criar diretório de uploads se não existir
    this.ensureUploadsDirectory();
  }

  /**
   * Sincroniza uma foto individual
   *
   * @param checklistRespostaId - ID da resposta do checklist
   * @param file - Arquivo da foto
   * @param metadados - Metadados da foto (opcional)
   * @returns Dados da foto salva
   */
  async sincronizarFoto(
    checklistRespostaId: number,
    file: any,
    metadados?: any
  ): Promise<FotoResponseDto> {
    this.logger.log(`Sincronizando foto para resposta ${checklistRespostaId}`);

    // Validar se a resposta existe e aguarda foto
    await this.validarRespostaAguardandoFoto(checklistRespostaId);

    // Salvar arquivo fisicamente
    const caminhoArquivo = await this.salvarArquivo(file, checklistRespostaId);

    // Gerar URL pública
    const urlPublica = this.gerarUrlPublica(caminhoArquivo);

    // Salvar no banco de dados
    const foto = await this.db.getPrisma().checklistRespostaFoto.create({
      data: {
        checklistRespostaId,
        caminhoArquivo,
        urlPublica,
        tamanhoBytes: BigInt(file.size),
        mimeType: file.mimetype,
        sincronizadoEm: new Date(),
        metadados: metadados || null,
        createdAt: new Date(),
        createdBy: 'system', // TODO: pegar do contexto do usuário
      },
    });

    // Incrementar contador de fotos
    await this.incrementarContadorFotos(checklistRespostaId);

    // Buscar pendência relacionada (se existir)
    const pendencia = await this.db.getPrisma().checklistPendencia.findUnique({
      where: { checklistRespostaId },
    });

    if (pendencia) {
      // Atualizar foto com referência à pendência
      await this.db.getPrisma().checklistRespostaFoto.update({
        where: { id: foto.id },
        data: { checklistPendenciaId: pendencia.id },
      });
    }

    this.logger.log(`Foto sincronizada com sucesso: ${foto.id}`);

    return {
      id: foto.id,
      checklistRespostaId: foto.checklistRespostaId,
      checklistPendenciaId: foto.checklistPendenciaId || undefined,
      urlPublica: foto.urlPublica || '',
      caminhoArquivo: foto.caminhoArquivo,
      tamanhoBytes: Number(foto.tamanhoBytes),
      mimeType: foto.mimeType,
      sincronizadoEm: foto.sincronizadoEm,
      metadados: foto.metadados,
    };
  }

  /**
   * Sincroniza múltiplas fotos em lote
   *
   * @param fotos - Lista de fotos para sincronizar
   * @returns Resultado do processamento em lote
   */
  async sincronizarFotoLote(
    fotos: Array<{ file: any; data: SincronizarFotoDto }>
  ): Promise<{
    totalProcessadas: number;
    sucessos: number;
    erros: number;
    resultados: Array<{
      checklistRespostaId: number;
      sucesso: boolean;
      foto?: FotoResponseDto;
      erro?: string;
    }>;
  }> {
    this.logger.log(`Sincronizando ${fotos.length} fotos em lote`);

    const resultados: Array<{
      checklistRespostaId: number;
      sucesso: boolean;
      foto?: FotoResponseDto;
      erro?: string;
    }> = [];

    let sucessos = 0;
    let erros = 0;

    for (const { file, data } of fotos) {
      try {
        const foto = await this.sincronizarFoto(
          data.checklistRespostaId,
          file,
          data.metadados
        );

        resultados.push({
          checklistRespostaId: data.checklistRespostaId,
          sucesso: true,
          foto,
        });

        sucessos++;
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar foto para resposta ${data.checklistRespostaId}:`,
          error
        );

        resultados.push({
          checklistRespostaId: data.checklistRespostaId,
          sucesso: false,
          erro: error.message,
        });

        erros++;
      }
    }

    this.logger.log(`Lote processado: ${sucessos} sucessos, ${erros} erros`);

    return {
      totalProcessadas: fotos.length,
      sucessos,
      erros,
      resultados,
    };
  }

  /**
   * Valida se uma resposta aguarda foto
   *
   * @param checklistRespostaId - ID da resposta
   */
  async validarRespostaAguardandoFoto(
    checklistRespostaId: number
  ): Promise<void> {
    const resposta = await this.db.getPrisma().checklistResposta.findUnique({
      where: { id: checklistRespostaId },
      include: {
        opcaoResposta: true,
      },
    });

    if (!resposta) {
      throw new NotFoundException('Resposta do checklist não encontrada');
    }

    if (!resposta.aguardandoFoto) {
      throw new BadRequestException('Esta resposta não aguarda foto');
    }

    if (!resposta.opcaoResposta.geraPendencia) {
      throw new BadRequestException(
        'Esta resposta não gera pendência, portanto não precisa de foto'
      );
    }
  }

  /**
   * Salva arquivo fisicamente no sistema de arquivos
   *
   * @param file - Arquivo a ser salvo
   * @param checklistRespostaId - ID da resposta (para organização)
   * @returns Caminho do arquivo salvo
   */
  async salvarArquivo(file: any, checklistRespostaId: number): Promise<string> {
    const timestamp = Date.now();
    const randomId = randomUUID().substring(0, 8);
    const extension = file.originalname.split('.').pop() || 'jpg';
    const filename = `${timestamp}_${randomId}.${extension}`;

    // Criar estrutura de pastas: uploads/checklists/{turnoId}/{checklistRespostaId}/
    const turnoId = await this.buscarTurnoIdDaResposta(checklistRespostaId);
    const dirPath = join(
      this.uploadsPath,
      turnoId.toString(),
      checklistRespostaId.toString()
    );

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    const filePath = join(dirPath, filename);

    // Salvar arquivo
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);

      writeStream.on('error', error => {
        this.logger.error('Erro ao salvar arquivo:', error);
        reject(new BadRequestException('Erro ao salvar arquivo'));
      });

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.write(file.buffer);
      writeStream.end();
    });
  }

  /**
   * Gera URL pública para acesso à foto
   *
   * @param caminhoArquivo - Caminho do arquivo
   * @returns URL pública
   */
  gerarUrlPublica(caminhoArquivo: string): string {
    // Por enquanto, retorna caminho relativo
    // TODO: Implementar CDN ou storage em nuvem
    const relativePath = caminhoArquivo.replace(process.cwd(), '');
    return `/uploads${relativePath}`;
  }

  /**
   * Incrementa contador de fotos sincronizadas
   *
   * @param checklistRespostaId - ID da resposta
   */
  async incrementarContadorFotos(checklistRespostaId: number): Promise<void> {
    await this.db.getPrisma().checklistResposta.update({
      where: { id: checklistRespostaId },
      data: {
        fotosSincronizadas: {
          increment: 1,
        },
        updatedAt: new Date(),
        updatedBy: 'system',
      },
    });
  }

  /**
   * Busca fotos de uma resposta específica
   *
   * @param checklistRespostaId - ID da resposta
   * @returns Lista de fotos da resposta
   */
  async buscarFotosDaResposta(
    checklistRespostaId: number
  ): Promise<ListarFotosRespostaDto> {
    const resposta = await this.db.getPrisma().checklistResposta.findUnique({
      where: { id: checklistRespostaId },
      include: {
        ChecklistRespostaFoto: {
          orderBy: { sincronizadoEm: 'desc' },
        },
      },
    });

    if (!resposta) {
      throw new NotFoundException('Resposta do checklist não encontrada');
    }

    const fotos = resposta.ChecklistRespostaFoto.map((foto: any) => ({
      id: foto.id,
      checklistRespostaId: foto.checklistRespostaId,
      checklistPendenciaId: foto.checklistPendenciaId || undefined,
      urlPublica: foto.urlPublica || '',
      caminhoArquivo: foto.caminhoArquivo,
      tamanhoBytes: Number(foto.tamanhoBytes),
      mimeType: foto.mimeType,
      sincronizadoEm: foto.sincronizadoEm,
      metadados: foto.metadados,
    }));

    return {
      checklistRespostaId,
      fotos,
      totalFotos: fotos.length,
      aguardandoMaisFotos: resposta.aguardandoFoto && fotos.length === 0,
    };
  }

  /**
   * Busca fotos de uma pendência específica
   *
   * @param checklistPendenciaId - ID da pendência
   * @returns Lista de fotos da pendência
   */
  async buscarFotosDaPendencia(
    checklistPendenciaId: number
  ): Promise<ListarFotosPendenciaDto> {
    const pendencia = await this.db.getPrisma().checklistPendencia.findUnique({
      where: { id: checklistPendenciaId },
      include: {
        ChecklistRespostaFoto: {
          orderBy: { sincronizadoEm: 'desc' },
        },
      },
    });

    if (!pendencia) {
      throw new NotFoundException('Pendência não encontrada');
    }

    const fotos = pendencia.ChecklistRespostaFoto.map((foto: any) => ({
      id: foto.id,
      checklistRespostaId: foto.checklistRespostaId,
      checklistPendenciaId: foto.checklistPendenciaId || undefined,
      urlPublica: foto.urlPublica || '',
      caminhoArquivo: foto.caminhoArquivo,
      tamanhoBytes: Number(foto.tamanhoBytes),
      mimeType: foto.mimeType,
      sincronizadoEm: foto.sincronizadoEm,
      metadados: foto.metadados,
    }));

    return {
      checklistPendenciaId,
      fotos,
      totalFotos: fotos.length,
    };
  }

  /**
   * Busca ID do turno de uma resposta
   *
   * @param checklistRespostaId - ID da resposta
   * @returns ID do turno
   */
  private async buscarTurnoIdDaResposta(
    checklistRespostaId: number
  ): Promise<number> {
    const resposta = await this.db.getPrisma().checklistResposta.findUnique({
      where: { id: checklistRespostaId },
      include: {
        checklistPreenchido: {
          select: { turnoId: true },
        },
      },
    });

    if (!resposta) {
      throw new NotFoundException('Resposta não encontrada');
    }

    return resposta.checklistPreenchido.turnoId;
  }

  /**
   * Garante que o diretório de uploads existe
   */
  private ensureUploadsDirectory(): void {
    if (!existsSync(this.uploadsPath)) {
      mkdirSync(this.uploadsPath, { recursive: true });
      this.logger.log(`Diretório de uploads criado: ${this.uploadsPath}`);
    }
  }
}
