/**
 * Controller para receber logs do client-side web
 *
 * Este controller recebe logs de erros do frontend e os salva
 * em arquivo separado para facilitar análise e debugging.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { WebLogDto } from './dto/web-log.dto';
import { WebLogsService } from './web-logs.service';

@ApiTags('web-logs')
@Controller('web-logs')
export class WebLogsController {
  constructor(private readonly webLogsService: WebLogsService) {}

  /**
   * Endpoint para receber logs de erro do client-side
   *
   * @param logDto - Dados do log a ser salvo
   * @returns Confirmação de recebimento
   */
  @Post('error')
  @ApiOperation({
    summary: 'Receber log de erro do client-side',
    description: 'Endpoint para receber e salvar logs de erro do frontend web',
  })
  @ApiResponse({
    status: 201,
    description: 'Log recebido e salvo com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async receiveErrorLog(
    @Body() logDto: WebLogDto
  ): Promise<{ success: boolean }> {
    await this.webLogsService.saveErrorLog(logDto);
    return { success: true };
  }
}
