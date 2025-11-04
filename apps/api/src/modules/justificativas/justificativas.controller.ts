import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JustificativasService } from './justificativas.service';
import { MAX_JUSTIFICATIVA_ANEXO_FILE_SIZE } from './constants/justificativa-upload.constants';

@Controller()
export class JustificativasController {
  constructor(private readonly service: JustificativasService) {}

  @Post('faltas/:faltaId/justificativas')
  async criar(
    @Param('faltaId', ParseIntPipe) faltaId: number,
    @Body() body: { tipoId: number; descricao?: string; createdBy?: string },
  ) {
    return this.service.criarJustificativa({
      faltaId,
      tipoId: body.tipoId,
      descricao: body.descricao,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Post('justificativas/:id/anexos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_JUSTIFICATIVA_ANEXO_FILE_SIZE,
      },
    })
  )
  async uploadAnexo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('uploadedBy') uploadedBy?: string,
  ) {
    if (!file) {
      throw new Error('Arquivo é obrigatório');
    }
    return this.service.uploadAnexo(file, id, uploadedBy ?? 'system');
  }

  @Post('justificativas/:id/aprovar')
  async aprovar(@Param('id', ParseIntPipe) id: number, @Body('decididoPor') decididoPor?: string) {
    return this.service.aprovarJustificativa(id, decididoPor ?? 'system');
  }

  @Post('justificativas/:id/rejeitar')
  async rejeitar(@Param('id', ParseIntPipe) id: number, @Body('decididoPor') decididoPor?: string) {
    return this.service.rejeitarJustificativa(id, decididoPor ?? 'system');
  }
}


