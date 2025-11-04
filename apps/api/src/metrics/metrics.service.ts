import { Injectable, Logger } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor() {
    try {
      this.registry = new Registry();

      // collectDefaultMetrics pode ser lento em alguns ambientes
      // Envolvido em try-catch para não travar a inicialização
      try {
        collectDefaultMetrics({ register: this.registry });
      } catch (error) {
        this.logger.warn(
          `Erro ao coletar métricas padrão (não bloqueante): ${error}. Continuando sem métricas de sistema.`
        );
      }

      this.httpRequestsTotal = new Counter({
        name: 'http_requests_total',
        help: 'Total de requisições HTTP',
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry],
      });

      this.httpRequestDuration = new Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duração das requisições HTTP em segundos',
        buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10],
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry],
      });
    } catch (error) {
      this.logger.error(`Erro crítico ao inicializar MetricsService: ${error}`);
      throw error;
    }
  }

  getRegistry(): Registry {
    return this.registry;
  }

  observeRequest(method: string, route: string, statusCode: number, seconds: number) {
    try {
      const labels = { method, route, status_code: String(statusCode) } as any;
      this.httpRequestsTotal.inc(labels, 1);
      this.httpRequestDuration.observe(labels, seconds);
    } catch (error) {
      // Não deve travar a aplicação se houver erro nas métricas
      this.logger.debug(`Erro ao observar métricas (não bloqueante): ${error}`);
    }
  }
}


