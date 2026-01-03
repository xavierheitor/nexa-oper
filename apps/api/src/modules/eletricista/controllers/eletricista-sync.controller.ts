/**
 * Controlador de Sincronização de Eletricistas
 *
 * Fornece endpoints específicos para clientes mobile sincronizarem
 * a base completa de eletricistas respeitando as permissões de contrato
 * do usuário autenticado.
 */

import { SyncAuditRemoverInterceptor } from '@common/interceptors';
import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
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

import { EletricistaSyncDto } from '../dto';
import { EletricistaService } from '../services/eletricista.service';

@ApiTags('eletricistas-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SyncAuditRemoverInterceptor)
@Controller('eletricistas/sync')
export class EletricistaSyncController {
  private readonly logger = new Logger(EletricistaSyncController.name);

  constructor(private readonly eletricistaService: EletricistaService) {}

  /**
   * Retorna todos os eletricistas permitidos para sincronização mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar eletricistas',
    description:
      'Retorna todos os eletricistas permitidos para sincronização mobile, ' +
      'respeitando as permissões de contrato do usuário autenticado. ' +
      'Dados retornados sem paginação para facilitar sincronização offline.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eletricistas retornada com sucesso',
    type: [EletricistaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de autenticação inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não tem permissão para acessar eletricistas',
  })
  async sync(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaSyncDto[]> {
    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );

    try {
      const result =
        await this.eletricistaService.findAllForSync(allowedContracts);

      this.logger.log(
        `Sincronização concluída - ${result?.length || 0} eletricistas retornados`
      );

      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de eletricistas:', error);
      throw error;
    }
  }
}
