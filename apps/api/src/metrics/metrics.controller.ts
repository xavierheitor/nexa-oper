import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async metrics(): Promise<string> {
    try {
      // getRegistry().metrics() pode ser lento em alguns casos
      // Mas não deve travar - é uma operação síncrona que apenas serializa
      return await this.metricsService.getRegistry().metrics();
    } catch (error) {
      // Se houver erro, retorna métricas vazias ao invés de travar
      return '# Erro ao coletar métricas\n';
    }
  }
}


