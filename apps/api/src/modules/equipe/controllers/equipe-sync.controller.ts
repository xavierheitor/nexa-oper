/**
 * Controlador de Sincronização de Equipes
 *
 * Fornece endpoints específicos para clientes mobile sincronizarem
 * a base completa de equipes respeitando as permissões de contrato
 * do usuário autenticado.
 */

import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { EquipeService } from '../services/equipe.service';
import { EquipeSyncDto } from '../dto';

@ApiTags('equipes-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('equipes/sync')
export class EquipeSyncController {
  private readonly logger = new Logger(EquipeSyncController.name);

  constructor(private readonly equipeService: EquipeService) {}

  /**
   * Retorna todas as equipes permitidas para sincronização mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar equipes',
    description:
      'Retorna todas as equipes ativas respeitando os contratos permitidos ao usuário autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de equipes para sincronização retornada com sucesso',
    type: [EquipeSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno do servidor',
  })
  async sync(
    @GetUserContracts() allowedContracts?: ContractPermission[]
  ): Promise<EquipeSyncDto[]> {
    this.logger.log('Iniciando sincronização de equipes para cliente mobile');
    this.logger.debug(
      `Contratos recebidos no controller: ${JSON.stringify(allowedContracts)}`
    );

    try {
      const equipes = await this.equipeService.findAllForSync(allowedContracts);
      this.logger.log(
        `Sincronização de equipes concluída - ${equipes.length} registros retornados`
      );
      return equipes;
    } catch (error) {
      this.logger.error('Erro durante sincronização de equipes:', error);
      throw error;
    }
  }
}
