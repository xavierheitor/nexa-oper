/**
 * Controlador de Sincronização de Equipes
 *
 * Status (checksum), sync full/incremental (?since=). Respeita
 * permissões de contrato. Criação/edição no web.
 *
 * ROTAS:
 * - GET /api/equipes/sync/status?checksum=opcional
 * - GET /api/equipes/sync?since=opcional
 */

import { GetUserContracts } from '@modules/engine/auth/decorators/get-user-contracts.decorator';
import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import { extractAllowedContractIds } from '@modules/engine/auth/utils/contract-helpers';
import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EquipeSyncDto } from '../dto';
import { EquipeSyncService } from '../services/equipe-sync.service';

@ApiTags('equipes-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipes/sync')
export class EquipeSyncController {
  private readonly logger = new Logger(EquipeSyncController.name);

  constructor(private readonly equipeSyncService: EquipeSyncService) {}

  private validateSince(since?: string): string | undefined {
    if (!since) return undefined;
    const t = new Date(since).getTime();
    if (Number.isNaN(t)) {
      throw new BadRequestException(
        'O parâmetro since deve ser uma data em formato ISO 8601 (ex: 2024-01-15T00:00:00.000Z)'
      );
    }
    return since;
  }

  @Get('status')
  @ApiOperation({
    summary: 'Status de sincronização Equipe (checksum)',
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
    schema: {
      type: 'object',
      properties: {
        changed: { type: 'boolean' },
        checksum: { type: 'string' },
        serverTime: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncStatus(
    @Query('checksum') checksum: string | undefined,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<{ changed: boolean; checksum: string; serverTime: string }> {
    this.logger.log('Iniciando verificação de status de sincronização Equipe');
    const ids = extractAllowedContractIds(allowedContracts);
    return this.equipeSyncService.getSyncStatus(checksum, ids);
  }

  @Get()
  @ApiOperation({
    summary: 'Sincronizar equipes',
    description:
      'Retorna equipes permitidas. Com ?since=ISO8601: incremental. Respeita contratos.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de equipes',
    type: [EquipeSyncDto],
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
    description: 'Usuário sem permissão para equipes',
  })
  async sync(
    @Query('since') since: string | undefined,
    @GetUserContracts() allowedContracts: ContractPermission[]
  ): Promise<EquipeSyncDto[]> {
    const s = this.validateSince(since);
    const ids = extractAllowedContractIds(allowedContracts);
    this.logger.log('Iniciando sincronização de equipes para cliente mobile');
    return this.equipeSyncService.findAllForSync(s, ids);
  }
}
