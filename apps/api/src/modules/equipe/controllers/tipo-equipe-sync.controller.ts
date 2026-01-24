/**
 * Controlador de Sincronização de Tipos de Equipe
 *
 * Este controlador gerencia exclusivamente os endpoints de sincronização
 * para clientes mobile, fornecendo dados completos sem paginação.
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api/tipo-equipe/sync - Sincronizar tipos de equipe
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
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { TipoEquipeSyncDto } from '../dto';
import { TipoEquipeService } from '../services/tipo-equipe.service';

@ApiTags('tipo-equipe-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('tipo-equipe/sync')
export class TipoEquipeSyncController {
  private readonly logger = new Logger(TipoEquipeSyncController.name);

  constructor(private readonly tipoEquipeService: TipoEquipeService) {}

  /**
   * Retorna todos os tipos de equipe para sincronização mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar tipos de equipe',
    description:
      'Retorna todos os tipos de equipe ativos para sincronização mobile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de equipe retornada com sucesso',
    type: [TipoEquipeSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async syncTipos(): Promise<TipoEquipeSyncDto[]> {
    this.logger.log('Iniciando sincronização de tipos de equipe');

    try {
      const result = await this.tipoEquipeService.findAllForSync();
      this.logger.log(
        `Sincronização concluída com ${result.length} tipos de equipe`
      );
      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de tipos de equipe:', error);
      throw error;
    }
  }
}
