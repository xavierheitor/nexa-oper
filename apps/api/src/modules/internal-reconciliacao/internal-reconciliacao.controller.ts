/**
 * Controller de Reconciliação Interna
 *
 * Endpoints internos para execução manual de reconciliação de turnos.
 * Protegido por InternalKeyGuard (requer header X-Internal-Key).
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ForceReconcileDto } from './dto/force-reconcile.dto';
import { ReconcileResponseDto } from './dto/reconcile-response.dto';
import { InternalKeyGuard } from './guards/internal-key.guard';
import { InternalReconciliacaoService } from './internal-reconciliacao.service';

@ApiTags('internal-reconciliacao')
@Controller('internal/reconciliacao')
@UseGuards(InternalKeyGuard)
export class InternalReconciliacaoController {
  constructor(private readonly service: InternalReconciliacaoService) {}

  @Post('turnos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forçar execução de reconciliação de turnos',
    description:
      'Executa reconciliação de turnos comparando escala planejada com turnos realizados. ' +
      'Requer header X-Internal-Key para autenticação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliação executada com sucesso',
    type: ReconcileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chave interna inválida ou ausente',
  })
  @ApiResponse({
    status: 409,
    description: 'Reconciliação já está em execução',
  })
  async forceReconcile(
    @Body() dto: ForceReconcileDto
  ): Promise<ReconcileResponseDto> {
    return this.service.runReconciliacao(dto, 'manual');
  }
}
