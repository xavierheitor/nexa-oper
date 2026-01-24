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
    const s = this.validateSince(since);
    const ids = extractAllowedContractIds(allowedContracts);
    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );
    return this.eletricistaSyncService.findAllForSync(s, ids);
  }
}
