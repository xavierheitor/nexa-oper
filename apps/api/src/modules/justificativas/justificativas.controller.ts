import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { JustificativasService } from './justificativas.service';

@Controller()
export class JustificativasController {
  constructor(private readonly service: JustificativasService) {}

  @Post('faltas/:faltaId/justificativas')
  async criar(
    @Param('faltaId', ParseIntPipe) faltaId: number,
    @Body() body: { tipoId: number; descricao?: string; createdBy?: string },
  ) {
    return this.service.criarJustificativa({
      faltaId,
      tipoId: body.tipoId,
      descricao: body.descricao,
      createdBy: body.createdBy ?? 'system',
    });
  }

  @Post('justificativas/:id/aprovar')
  async aprovar(@Param('id', ParseIntPipe) id: number, @Body('decididoPor') decididoPor?: string) {
    return this.service.aprovarJustificativa(id, decididoPor ?? 'system');
  }

  @Post('justificativas/:id/rejeitar')
  async rejeitar(@Param('id', ParseIntPipe) id: number, @Body('decididoPor') decididoPor?: string) {
    return this.service.rejeitarJustificativa(id, decididoPor ?? 'system');
  }
}


