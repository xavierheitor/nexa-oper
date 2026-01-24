/**
 * Controlador de Sincronização de Veículos
 *
 * Fornece endpoints específicos para clientes mobile sincronizarem
 * a base completa de veículos respeitando as permissões de contrato
 * do usuário autenticado.
 */

import { SyncEndpoint } from '@common/decorators';
import { GetUserContracts } from '@core/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { Controller, Get, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { VeiculoSyncDto } from '../dto';
import { VeiculoService } from '../services/veiculo.service';

@SyncEndpoint('veiculos-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('veiculos/sync')
export class VeiculoSyncController {
  private readonly logger = new Logger(VeiculoSyncController.name);

  constructor(private readonly veiculoService: VeiculoService) {}

  /**
   * Retorna todos os veículos permitidos para sincronização mobile
   */
  @Get()
  @ApiOperation({
    summary: 'Sincronizar veículos',
    description:
      'Retorna todos os veículos ativos respeitando os contratos permitidos ao usuário autenticado',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de veículos retornada com sucesso',
    type: [VeiculoSyncDto],
  })
  async syncVeiculos(
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<VeiculoSyncDto[]> {
    this.logger.log('Sincronizando veículos para cliente mobile');
    this.logger.debug(
      `Contratos recebidos: ${JSON.stringify(allowedContracts)}`
    );
    this.logger.debug(`Tipo dos contratos: ${typeof allowedContracts}`);
    this.logger.debug(`É array: ${Array.isArray(allowedContracts)}`);
    this.logger.debug(
      `Quantidade de contratos: ${allowedContracts?.length || 0}`
    );

    try {
      const result = await this.veiculoService.findAllForSync(allowedContracts);
      this.logger.log(`Sincronização concluída com ${result.length} veículos`);
      return result;
    } catch (error) {
      this.logger.error('Erro na sincronização de veículos:', error);
      throw error;
    }
  }
}
