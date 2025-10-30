import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

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
  }

  getRegistry(): Registry {
    return this.registry;
  }

  observeRequest(method: string, route: string, statusCode: number, seconds: number) {
    const labels = { method, route, status_code: String(statusCode) } as any;
    this.httpRequestsTotal.inc(labels, 1);
    this.httpRequestDuration.observe(labels, seconds);
  }
}


