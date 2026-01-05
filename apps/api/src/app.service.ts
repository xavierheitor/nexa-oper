/**
 * Serviço Principal da Aplicação Nexa Oper API
 *
 * Este serviço contém a lógica de negócio para endpoints básicos
 * da aplicação, incluindo health checks e informações gerais.
 *
 * RESPONSABILIDADES:
 * - Lógica de health check com verificação de serviços
 * - Geração de informações da aplicação
 * - Monitoramento de recursos do sistema
 * - Verificação de conectividade com dependências
 *
 * FUNCIONALIDADES:
 * - Health check detalhado com status de serviços
 * - Informações de versão e ambiente
 * - Métricas de performance básicas
 * - Status de conectividade com banco de dados
 *
 * PADRÕES IMPLEMENTADOS:
 * - Injeção de dependência
 * - Logging estruturado
 * - Tratamento de erros
 * - Tipagem TypeScript rigorosa
 *
 * @example
 * ```typescript
 * const appInfo = await appService.getAppInfo(startTime);
 * const health = await appService.getHealthCheck(startTime);
 * ```
 */

import { DatabaseService } from '@database/database.service';
import { Injectable, Logger } from '@nestjs/common';

import { AppInfoResponse, HealthCheckResponse } from './app.controller';

/**
 * Serviço principal da aplicação
 *
 * Implementa a lógica de negócio para endpoints básicos
 * e funcionalidades de monitoramento da aplicação.
 */
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retorna informações básicas da aplicação
   *
   * Coleta e formata informações sobre a aplicação incluindo
   * versão, ambiente, tempo de inicialização e links úteis.
   *
   * @param startTime - Timestamp de quando a aplicação foi iniciada
   * @returns Informações estruturadas da aplicação
   *
   * @example
   * ```typescript
   * const info = appService.getAppInfo(new Date());
   * console.log(`API ${info.name} v${info.version} rodando em ${info.environment}`);
   * ```
   */
  getAppInfo(startTime: Date): AppInfoResponse {
    this.logger.log('Coletando informações da aplicação');

    const info: AppInfoResponse = {
      name: 'Nexa Oper API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      startedAt: startTime.toISOString(),
    };

    // Adicionar link da documentação apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      const port = process.env.PORT || 3001;
      info.documentation = `http://localhost:${port}/api/docs`;
    }

    this.logger.log(`Informações coletadas: ${info.name} v${info.version}`);
    return info;
  }

  /**
   * Executa health check completo da aplicação
   *
   * Verifica o status de todos os serviços críticos incluindo:
   * - Conectividade com banco de dados
   * - Uso de memória do sistema
   * - Tempo de atividade da aplicação
   * - Status geral de saúde
   *
   * @param startTime - Timestamp de quando a aplicação foi iniciada
   * @returns Status detalhado de saúde da aplicação
   *
   * @example
   * ```typescript
   * const health = await appService.getHealthCheck(startTime);
   * if (health.status === 'healthy') {
   *   console.log('Aplicação funcionando normalmente');
   * }
   * ```
   */
  async getHealthCheck(startTime: Date): Promise<HealthCheckResponse> {
    this.logger.log('Executando health check completo');

    try {
      // Verificar conectividade com banco de dados
      const isDatabaseHealthy = await this.databaseService.healthCheck();

      // Coletar métricas de memória
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

      // Calcular tempo de atividade
      const uptimeSeconds = Math.floor(
        (Date.now() - startTime.getTime()) / 1000
      );

      // Determinar status geral
      const isHealthy = isDatabaseHealthy && memoryPercentage < 90;

      const healthStatus: HealthCheckResponse = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: uptimeSeconds,
        services: {
          database: isDatabaseHealthy ? 'connected' : 'disconnected',
          memory: {
            used: memoryUsedMB,
            total: memoryTotalMB,
            percentage: memoryPercentage,
          },
        },
      };

      this.logger.log(
        `Health check concluído: ${healthStatus.status} ` +
          `(DB: ${healthStatus.services.database}, ` +
          `Memória: ${memoryPercentage}%, ` +
          `Uptime: ${uptimeSeconds}s)`
      );

      return healthStatus;
    } catch (error) {
      this.logger.error('Erro durante health check:', error);

      // Retornar status unhealthy em caso de erro
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime.getTime()) / 1000),
        services: {
          database: 'disconnected',
          memory: {
            used: 0,
            total: 0,
            percentage: 0,
          },
        },
      };
    }
  }

  /**
   * Retorna apenas a versão da aplicação
   *
   * Método simples para obter rapidamente a versão atual
   * sem informações adicionais.
   *
   * @returns Objeto com a versão da aplicação
   *
   * @example
   * ```typescript
   * const { version } = appService.getVersion();
   * console.log(`Versão atual: ${version}`);
   * ```
   */
  getVersion(): { version: string } {
    const version = process.env.npm_package_version || '1.0.0';
    this.logger.log(`Versão solicitada: ${version}`);

    return { version };
  }
}
