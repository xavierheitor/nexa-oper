import { Public } from '@common/decorators/public.decorator';
import { Controller, Get, Header } from '@nestjs/common';

import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async metrics(): Promise<string> {
    try {
      // getRegistry().metrics() pode ser lento em alguns casos
      // Adiciona timeout para não travar a requisição
      const metricsPromise = Promise.resolve(
        this.metricsService.getRegistry().metrics()
      );
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Metrics collection timeout')), 2000);
      });

      return await Promise.race([metricsPromise, timeoutPromise]);
    } catch (error) {
      // Se houver erro ou timeout, retorna métricas vazias ao invés de travar
      return '# Erro ao coletar métricas\n';
    }
  }
}
