/**
 * Controller para sincronização de fotos de checklist
 *
 * Este controller gerencia os endpoints para upload e sincronização
 * de fotos de checklists de forma assíncrona.
 */

import { GetUsuarioMobileId } from '@core/auth/decorators/get-user-id-decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Logger,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import {
  FotoResponseDto,
  FotoLoteResponseDto,
  ListarFotosRespostaDto,
  ListarFotosPendenciaDto,
} from '../dto';
import { ChecklistFotoService } from '../services/checklist-foto.service';

/**
 * Controller responsável pela sincronização de fotos de checklist
 */
@ApiTags('checklist-foto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turno/checklist/foto')
export class ChecklistFotoController {
  private readonly logger = new Logger(ChecklistFotoController.name);

  constructor(private readonly checklistFotoService: ChecklistFotoService) {}

  /**
   * Sincroniza uma foto individual
   *
   * @param file - Arquivo da foto
   * @param checklistRespostaId - ID da resposta do checklist
   * @param turnoId - ID do turno (opcional, para validação)
   * @param metadados - Metadados da foto (opcional)
   * @returns Dados da foto sincronizada
   */
  @Post('sincronizar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Sincroniza uma foto individual',
    description:
      'Endpoint para upload de uma foto específica de uma resposta de checklist',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dados da foto para sincronização',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo da foto (JPEG, PNG, WebP)',
        },
        checklistRespostaId: {
          type: 'number',
          description: 'ID da resposta do checklist',
        },
        turnoId: {
          type: 'number',
          description: 'ID do turno (opcional, para validação)',
        },
        metadados: {
          type: 'string',
          description: 'Metadados da foto em JSON (opcional)',
        },
      },
      required: ['file', 'checklistRespostaId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Foto sincronizada com sucesso',
    type: FotoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou arquivo não aceito',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resposta do checklist não encontrada',
  })
  async sincronizarFoto(
    @UploadedFile() file: any,
    @Body('checklistRespostaId', ParseIntPipe) checklistRespostaId: number,
    @Body('turnoId') turnoId?: number,
    @Body('metadados') metadados?: string,
    @GetUsuarioMobileId() userId?: string
  ): Promise<FotoResponseDto> {
    this.logger.log(`Sincronizando foto para resposta ${checklistRespostaId}`);

    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP');
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo 10MB');
    }

    const metadadosParsed = this.parseMetadadosFoto(metadados);
    return this.checklistFotoService.sincronizarFoto(
      checklistRespostaId,
      file,
      metadadosParsed,
      userId
    );
  }

  private parseMetadadosFoto(metadados?: string): unknown {
    if (!metadados) return null;
    try {
      return JSON.parse(metadados);
    } catch (error) {
      this.logger.warn('Metadados inválidos, ignorando:', error);
      return null;
    }
  }

  /**
   * Sincroniza múltiplas fotos em lote
   *
   * @param files - Array de arquivos
   * @param checklistRespostaIds - IDs das respostas (JSON array)
   * @param turnoIds - IDs dos turnos (JSON array, opcional)
   * @param metadadosArray - Array de metadados (JSON array, opcional)
   * @returns Resultado do processamento em lote
   */
  @Post('sincronizar-lote')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 arquivos
  @ApiOperation({
    summary: 'Sincroniza múltiplas fotos em lote',
    description: 'Endpoint para upload de múltiplas fotos de uma vez',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dados das fotos para sincronização em lote',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array de arquivos de foto',
        },
        checklistRespostaIds: {
          type: 'string',
          description: 'Array de IDs das respostas em JSON',
        },
        turnoIds: {
          type: 'string',
          description: 'Array de IDs dos turnos em JSON (opcional)',
        },
        metadadosArray: {
          type: 'string',
          description: 'Array de metadados em JSON (opcional)',
        },
      },
      required: ['files', 'checklistRespostaIds'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fotos processadas com sucesso',
    type: FotoLoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou arquivos não aceitos',
  })
  async sincronizarFotoLote(
    @UploadedFiles() files: any[],
    @Body('checklistRespostaIds') checklistRespostaIds: string,
    @Body('turnoIds') turnoIds?: string,
    @Body('metadadosArray') metadadosArray?: string,
    @GetUsuarioMobileId() userId?: string
  ): Promise<FotoLoteResponseDto> {
    this.logger.log(`Sincronizando ${files.length} fotos em lote`);

    if (!files || files.length === 0) {
      throw new Error('Nenhum arquivo fornecido');
    }

    const { checklistRespostaIdsParsed, turnoIdsParsed, metadadosArrayParsed } =
      this.parseLoteBody(checklistRespostaIds, turnoIds, metadadosArray);

    if (checklistRespostaIdsParsed.length !== files.length) {
      throw new Error(
        'Número de arquivos deve ser igual ao número de checklistRespostaIds'
      );
    }

    const fotos = files.map((file, index) => ({
      file,
      data: {
        checklistRespostaId: checklistRespostaIdsParsed[index],
        turnoId: turnoIdsParsed?.[index],
        metadados: metadadosArrayParsed?.[index],
      },
    }));

    return this.checklistFotoService.sincronizarFotoLote(fotos, userId);
  }

  private parseLoteBody(
    checklistRespostaIds: string,
    turnoIds?: string,
    metadadosArray?: string
  ): {
    checklistRespostaIdsParsed: number[];
    turnoIdsParsed: number[] | undefined;
    metadadosArrayParsed: unknown[] | undefined;
  } {
    let checklistRespostaIdsParsed: number[];
    try {
      checklistRespostaIdsParsed = JSON.parse(checklistRespostaIds);
    } catch (error) {
      throw new Error(
        `checklistRespostaIds deve ser um array JSON válido: ${error}`
      );
    }

    let turnoIdsParsed: number[] | undefined;
    if (turnoIds) {
      try {
        turnoIdsParsed = JSON.parse(turnoIds);
      } catch (error) {
        this.logger.warn('turnoIds inválido, ignorando:', error);
      }
    }

    let metadadosArrayParsed: unknown[] | undefined;
    if (metadadosArray) {
      try {
        metadadosArrayParsed = JSON.parse(metadadosArray);
      } catch (error) {
        this.logger.warn('metadadosArray inválido, ignorando:', error);
      }
    }

    return {
      checklistRespostaIdsParsed,
      turnoIdsParsed,
      metadadosArrayParsed,
    };
  }

  /**
   * Lista fotos de uma resposta específica
   *
   * @param id - ID da resposta do checklist
   * @returns Lista de fotos da resposta
   */
  @Get('resposta/:id/fotos')
  @ApiOperation({
    summary: 'Lista fotos de uma resposta',
    description:
      'Retorna todas as fotos sincronizadas de uma resposta específica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de fotos retornada com sucesso',
    type: ListarFotosRespostaDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resposta do checklist não encontrada',
  })
  async listarFotosResposta(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ListarFotosRespostaDto> {
    this.logger.log(`Listando fotos da resposta ${id}`);
    return this.checklistFotoService.buscarFotosDaResposta(id);
  }

  /**
   * Lista fotos de uma pendência específica
   *
   * @param id - ID da pendência
   * @returns Lista de fotos da pendência
   */
  @Get('pendencia/:id/fotos')
  @ApiOperation({
    summary: 'Lista fotos de uma pendência',
    description:
      'Retorna todas as fotos relacionadas a uma pendência específica',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de fotos retornada com sucesso',
    type: ListarFotosPendenciaDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pendência não encontrada',
  })
  async listarFotosPendencia(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ListarFotosPendenciaDto> {
    this.logger.log(`Listando fotos da pendência ${id}`);
    return this.checklistFotoService.buscarFotosDaPendencia(id);
  }
}
