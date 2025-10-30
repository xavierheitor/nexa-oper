import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TurnoRealizadoService } from './turno-realizado.service';
import type { AbrirTurnoPayload } from './turno-realizado.service';

@Controller('turnos')
export class TurnoRealizadoController {
  constructor(private readonly service: TurnoRealizadoService) {}

  @Post('aberturas')
  async abrir(@Body() body: AbrirTurnoPayload) {
    // Observação: validação DTO/Zod a ser adicionada conforme padrões do projeto
    const exec = body.executadoPor ?? 'system';
    return await this.service.abrirTurno({ ...body, executadoPor: exec });
  }

  @Post(':turnoId/fechamento')
  async fechar(
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Body('executadoPor') executadoPor: string,
  ) {
    const exec = executadoPor ?? 'system';
    return await this.service.fecharTurno(turnoId, exec);
  }

  @Get('resumo')
  async resumo(@Query('data') data: string, @Query('equipe') equipe: string) {
    return this.service.resumo({ data, equipeId: Number(equipe) });
  }
}


