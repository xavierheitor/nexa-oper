/**
 * Utilitário para graceful shutdown da aplicação
 *
 * Garante que a aplicação seja finalizada de forma controlada,
 * permitindo que requisições em andamento sejam concluídas antes
 * de encerrar o processo.
 */

import { INestApplication } from '@nestjs/common';
import { StandardLogger } from '@common/utils/logger';

/**
 * Configura graceful shutdown para a aplicação
 *
 * Registra handlers para os sinais SIGTERM, SIGINT e SIGHUP.
 * Quando qualquer um desses sinais é recebido, inicia o processo
 * de shutdown graceful, dando até 30 segundos para a aplicação
 * finalizar antes de forçar a saída.
 *
 * @param app - Instância da aplicação NestJS
 * @param logger - Logger para registrar mensagens
 */
export function setupGracefulShutdown(
  app: INestApplication,
  logger: StandardLogger
): void {
  const gracefulShutdown = async (signal: string) => {
    logger.log(`🔄 Recebido sinal ${signal}. Iniciando graceful shutdown...`);

    try {
      const shutdownTimeout = setTimeout(() => {
        logger.error('❌ Timeout no graceful shutdown. Forçando saída...');
        process.exit(1);
      }, 30_000);

      await app.close();
      clearTimeout(shutdownTimeout);
      logger.log('✅ Aplicação finalizada com sucesso');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Erro durante graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGHUP', () => void gracefulShutdown('SIGHUP'));
}

