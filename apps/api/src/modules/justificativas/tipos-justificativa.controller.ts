import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { JustificativasService } from './justificativas.service';

@Controller('tipos-justificativa')
export class TiposJustificativaController {
  constructor(private readonly service: JustificativasService) {}

  @Get()
  async listar() {
    return this.service.listarTipos();
  }

  @Post()
  async criar(@Body() body: { nome: string; descricao?: string; ativo?: boolean; createdBy?: string }) {
    return this.service.criarTipo({
      nome: body.nome,
      descricao: body.descricao,
      ativo: body.ativo ?? true,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nome?: string; descricao?: string; ativo?: boolean; updatedBy?: string },
  ) {
    return this.service.atualizarTipo(id, {
      nome: body.nome,
      descricao: body.descricao,
      ativo: body.ativo,
      updatedBy: body.updatedBy ?? 'system',
    });
  }
}


