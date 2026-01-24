/**
 * Controlador de Sincronização de Tipos de Veículo
 *
 * GET /api/tipo-veiculo/sync - Sincronizar tipos de veículo para mobile
 */

import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { TipoVeiculoSyncDto } from '../dto';
import { TipoVeiculoService } from '../services/tipo-veiculo.service';

@ApiTags('tipo-veiculo-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('tipo-veiculo/sync')
export class TipoVeiculoSyncController {
  private readonly logger = new Logger(TipoVeiculoSyncController.name);

  constructor(private readonly tipoVeiculoService: TipoVeiculoService) {}

  @Get()
  @ApiOperation({
    summary: 'Sincronizar tipos de veículo',
    description: 'Retorna todos os tipos de veículo ativos para sincronização mobile',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [TipoVeiculoSyncDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED })
  async syncTipos(): Promise<TipoVeiculoSyncDto[]> {
    this.logger.log('Iniciando sincronização de tipos de veículo');
    try {
      const result = await this.tipoVeiculoService.findAllForSync();
      this.logger.log(`Sincronização concluída com ${result.length} tipos de veículo`);
      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de tipos de veículo:', error);
      throw error;
    }
  }
}
