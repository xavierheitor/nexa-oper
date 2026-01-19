/**
 * Controlador de Sincronização de Checklists
 *
 * Gerencia os endpoints de sincronização para clientes mobile: status (checksum),
 * modelos, perguntas, relações. Criação/edição de checklists é feita no web.
 *
 * ROTAS:
 * - GET /api/checklist/sync/status?checksum=opcional - Status (checksum); changed=false dispensa download
 * - GET /api/checklist/sync/modelos?since=opcional
 * - GET /api/checklist/sync/perguntas?since=opcional
 * - GET /api/checklist/sync/perguntas/relacoes?since=opcional
 * - GET /api/checklist/sync/opcoes-resposta?since=opcional
 * - GET /api/checklist/sync/opcoes-resposta/relacoes?since=opcional
 * - GET /api/checklist/sync/tipos-veiculo/relacoes?since=opcional
 * - GET /api/checklist/sync/tipos-equipe/relacoes?since=opcional
 */

import { JwtAuthGuard } from '@modules/engine/auth/guards/jwt-auth.guard';
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

import {
  ChecklistOpcaoRespostaRelacaoSyncDto,
  ChecklistOpcaoRespostaSyncDto,
  ChecklistPerguntaRelacaoSyncDto,
  ChecklistPerguntaSyncDto,
  ChecklistResponseDto,
  ChecklistTipoEquipeRelacaoSyncDto,
  ChecklistTipoVeiculoRelacaoSyncDto,
} from '../dto';
import { ChecklistSyncService } from '../services/checklist-sync.service';

@ApiTags('checklist-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist/sync')
export class ChecklistSyncController {
  private readonly logger = new Logger(ChecklistSyncController.name);

  constructor(private readonly checklistSyncService: ChecklistSyncService) {}

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
    summary: 'Status de sincronização Checklist (checksum)',
    description:
      'Retorna checksum e indica se houve mudanças. Se changed=false, o mobile pode pular o download.',
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
    @Query('checksum') checksum?: string
  ): Promise<{ changed: boolean; checksum: string; serverTime: string }> {
    this.logger.log(
      'Iniciando verificação de status de sincronização Checklist'
    );
    return this.checklistSyncService.getSyncStatus(checksum);
  }

  @Get('modelos')
  @ApiOperation({
    summary: 'Sincronizar checklists',
    description: 'Retorna checklists ativos. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de checklists',
    type: [ChecklistResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncModelos(
    @Query('since') since?: string
  ): Promise<ChecklistResponseDto[]> {
    const s = this.validateSince(since);
    this.logger.log('Iniciando sincronização de checklists');
    return this.checklistSyncService.findAllForSync(s);
  }

  @Get('perguntas')
  @ApiOperation({
    summary: 'Sincronizar perguntas',
    description:
      'Retorna perguntas de checklist. Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [ChecklistPerguntaSyncDto] })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncPerguntas(
    @Query('since') since?: string
  ): Promise<ChecklistPerguntaSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log('Iniciando sincronização de perguntas de checklist');
    return this.checklistSyncService.findAllPerguntasForSync(s);
  }

  @Get('perguntas/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Perguntas',
    description: 'Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ChecklistPerguntaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncPerguntaRelacoes(
    @Query('since') since?: string
  ): Promise<ChecklistPerguntaRelacaoSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log('Iniciando sincronização de relações Checklist-Perguntas');
    return this.checklistSyncService.findAllPerguntaRelacoesForSync(s);
  }

  @Get('opcoes-resposta')
  @ApiOperation({
    summary: 'Sincronizar opções de resposta',
    description: 'Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [ChecklistOpcaoRespostaSyncDto] })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncOpcoes(
    @Query('since') since?: string
  ): Promise<ChecklistOpcaoRespostaSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log(
      'Iniciando sincronização de opções de resposta de checklist'
    );
    return this.checklistSyncService.findAllOpcoesForSync(s);
  }

  @Get('opcoes-resposta/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Opções',
    description: 'Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ChecklistOpcaoRespostaRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncOpcaoRelacoes(
    @Query('since') since?: string
  ): Promise<ChecklistOpcaoRespostaRelacaoSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log('Iniciando sincronização de relações Checklist-Opções');
    return this.checklistSyncService.findAllOpcaoRelacoesForSync(s);
  }

  @Get('tipos-veiculo/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Tipo de Veículo',
    description: 'Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ChecklistTipoVeiculoRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncTipoVeiculoRelacoes(
    @Query('since') since?: string
  ): Promise<ChecklistTipoVeiculoRelacaoSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log(
      'Iniciando sincronização de relações Checklist-Tipo de Veículo'
    );
    return this.checklistSyncService.findAllTipoVeiculoRelacoesForSync(s);
  }

  @Get('tipos-equipe/relacoes')
  @ApiOperation({
    summary: 'Sincronizar relações Checklist-Tipo de Equipe',
    description: 'Com ?since=ISO8601: incremental.',
  })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Data ISO 8601 para sincronização incremental',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ChecklistTipoEquipeRelacaoSyncDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetro since inválido',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou ausente',
  })
  async syncTipoEquipeRelacoes(
    @Query('since') since?: string
  ): Promise<ChecklistTipoEquipeRelacaoSyncDto[]> {
    const s = this.validateSince(since);
    this.logger.log(
      'Iniciando sincronização de relações Checklist-Tipo de Equipe'
    );
    return this.checklistSyncService.findAllTipoEquipeRelacoesForSync(s);
  }
}
