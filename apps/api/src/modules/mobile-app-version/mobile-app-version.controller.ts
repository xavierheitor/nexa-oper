import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MobileAppVersionService } from './mobile-app-version.service';
import { CreateMobileAppVersionDto } from './dto/mobile-app-version.dto';
import { AppError } from '../../core/errors/app-error';

// Limite alto (ex: 200MB) para lidar com APKs, overrides upload module default
const APK_MEMORY_LIMIT = 200 * 1024 * 1024;

@ApiTags('mobile-app-version')
@ApiBearerAuth()
@Controller('mobile-app-version')
export class MobileAppVersionController {
  constructor(private readonly service: MobileAppVersionService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: APK_MEMORY_LIMIT } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Fazer upload e cadastrar uma nova versão do app' })
  async create(
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    @Body() dto: CreateMobileAppVersionDto,
  ) {
    if (!file) {
      throw AppError.validation('Arquivo APK faltando.');
    }
    // Uma checagem de mimetype opcional: 'application/vnd.android.package-archive'
    if (!file.originalname.toLowerCase().endsWith('.apk')) {
      throw AppError.validation(
        'Apenas arquivos .apk são permitidos no momento.',
      );
    }

    return this.service.create(dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as versões' })
  async findAll() {
    return this.service.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir versão' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true };
  }

  @Patch(':id/active')
  @ApiOperation({
    summary:
      'Marcar versão como ativa (Desativa as demais da mesma plataforma)',
  })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.activate(id);
  }
}
