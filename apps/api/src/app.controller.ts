/**
 * Controlador Principal da Aplicação Nexa Oper API
 *
 * Este controlador fornece endpoints básicos da API incluindo
 * health checks, informações da aplicação e status geral.
 *
 * RESPONSABILIDADES:
 * - Health check para monitoramento da aplicação
 * - Informações básicas da API (versão, status)
 * - Endpoint de boas-vindas/documentação básica
 * - Status de conectividade com serviços externos
 *
 * ROTAS DISPONÍVEIS:
 * - GET /api - Informações básicas da API
 * - GET /api/health - Health check da aplicação
 * - GET /api/version - Versão da aplicação
 *
 * PADRÕES IMPLEMENTADOS:
 * - Documentação Swagger automática
 * - Tratamento de erros padronizado
 * - Logging estruturado de requisições
 * - Tipagem TypeScript rigorosa
 *
 * @example
 * ```bash
 * # Verificar status da API
 * curl http://localhost:3001/api
 *
 * # Health check
 * curl http://localhost:3001/api/health
 * ```
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

/**
 * Interface para resposta de health check
 *
 * Define a estrutura padronizada da resposta do endpoint de saúde.
 */
export interface HealthCheckResponse {
  /** Status geral da aplicação */
  status: 'healthy' | 'unhealthy';

  /** Timestamp da verificação */
  timestamp: string;

  /** Tempo de atividade da aplicação */
  uptime: number;

  /** Status dos serviços dependentes */
  services: {
    database: 'connected' | 'disconnected';
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * Interface para informações da aplicação
 *
 * Define a estrutura das informações básicas retornadas pela API.
 */
export interface AppInfoResponse {
  /** Nome da aplicação */
  name: string;

  /** Versão atual */
  version: string;

  /** Ambiente de execução */
  environment: string;

  /** Timestamp de inicialização */
  startedAt: string;

  /** Documentação disponível */
  documentation?: string;
}

/**
 * Controlador principal da aplicação
 *
 * Fornece endpoints básicos para monitoramento, informações
 * e verificação de status da API Nexa Oper.
 */
@ApiTags('app')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly startTime = new Date();

  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint de informações básicas da API
   *
   * Retorna informações gerais sobre a aplicação incluindo
   * versão, ambiente e links para documentação.
   *
   * @returns Informações básicas da aplicação
   */
  @Get()
  @ApiOperation({
    summary: 'Informações da API',
    description: 'Retorna informações básicas sobre a API Nexa Oper',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações da API retornadas com sucesso',
  })
  getAppInfo(): AppInfoResponse {
    this.logger.log('Solicitação de informações da aplicação');
    return this.appService.getAppInfo(this.startTime);
  }

  /**
   * Health check da aplicação
   *
   * Verifica o status geral da aplicação incluindo:
   * - Conectividade com banco de dados
   * - Uso de memória
   * - Tempo de atividade
   * - Status de serviços críticos
   *
   * @returns Status detalhado da aplicação
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica o status de saúde da aplicação e seus serviços',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde retornado com sucesso',
  })
  async getHealthCheck(): Promise<HealthCheckResponse> {
    this.logger.log('Executando health check da aplicação');
    return await this.appService.getHealthCheck(this.startTime);
  }

  /**
   * Versão da aplicação
   *
   * Retorna apenas a versão atual da API de forma simples.
   *
   * @returns Versão da aplicação
   */
  @Get('version')
  @ApiOperation({
    summary: 'Versão da API',
    description: 'Retorna a versão atual da API',
  })
  @ApiResponse({
    status: 200,
    description: 'Versão retornada com sucesso',
  })
  getVersion(): { version: string } {
    this.logger.log(
      'Solicitação de versão da aplicação - watch mode funcionando!'
    );
    return this.appService.getVersion();
  }
}
