/**
 * Controlador de Sincronização de Eletricistas
 *
 * Status (checksum), sincronização full/incremental (?since=). Respeita
 * permissões de contrato. Criação/edição no web.
 *
 * ROTAS:
 * - GET /api/eletricistas/sync/status?checksum=opcional
 * - GET /api/eletricistas/sync?since=opcional
 */

import { validateSince } from '@common/utils/sync-params';
import { GetUserContracts } from '@core/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import { extractAllowedContractIds } from '@core/auth/utils/contract-helpers';
import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SyncStatusResponseDto } from '@common/dto/sync-status.dto';
import { EletricistaSyncDto } from '../dto';
import { EletricistaSyncService } from '../services/eletricista-sync.service';

@ApiTags('eletricistas-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eletricistas/sync')
export class EletricistaSyncController {
  private readonly logger = new Logger(EletricistaSyncController.name);

  constructor(
    private readonly eletricistaSyncService: EletricistaSyncService
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Status de sincronização Eletricista (checksum)',
    description:
      'Retorna checksum e indica se houve mudanças. Respeita contratos do usuário.',
  })
  @ApiQuery({
    name: 'checksum',
    required: false,
    description: 'Checksum da última sincronização',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status retornado com sucesso',
    type: SyncStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncStatus(
    @Query('checksum') checksum: string | undefined,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<SyncStatusResponseDto> {
    this.logger.log(
      'Iniciando verificação de status de sincronização Eletricista'
    );
    const ids = extractAllowedContractIds(allowedContracts);
    return this.eletricistaSyncService.getSyncStatus(checksum, ids);
  }

  @Get()
  @ApiOperation({
    summary: 'Sincronizar eletricistas',
    description:
      'Retorna eletricistas permitidos. Com ?since=ISO8601: incremental. Respeita contratos.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eletricistas',
    type: [EletricistaSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário sem permissão para eletricistas',
  })
  async sync(
    @Query('since') since: string | undefined,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EletricistaSyncDto[]> {
    const s = validateSince(since);
    const ids = extractAllowedContractIds(allowedContracts);
    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );
    return this.eletricistaSyncService.findAllForSync(s, ids);
  }
}
