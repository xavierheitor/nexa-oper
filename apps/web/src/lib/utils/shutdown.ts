/**
 * Utilitário de Graceful Shutdown para Next.js
 *
 * Este módulo implementa graceful shutdown para a aplicação Next.js web,
 * garantindo que conexões com banco de dados e outros recursos sejam
 * liberados corretamente durante o encerramento da aplicação.
 *
 * FUNCIONALIDADES:
 * - Handlers para SIGTERM e SIGINT
 * - Desconexão limpa do Prisma
 * - Timeout de shutdown para evitar travamentos
 * - Logging de eventos de shutdown
 * - Prevenção de múltiplos shutdowns simultâneos
 *
 * COMO FUNCIONA:
 * 1. Registra handlers para SIGTERM e SIGINT
 * 2. Ao receber sinal, fecha conexões do Prisma
 * 3. Aguarda até 30 segundos para conclusão
 * 4. Força saída se timeout exceder
 *
 * CONFIGURAÇÃO:
 * - Importar este módulo no início da aplicação
 * - Handlers são registrados automaticamente
 * - Não requer configuração adicional
 *
 * SEGURANÇA:
 * - Previne vazamentos de conexão
 * - Garante cleanup adequado de recursos
 * - Evita corrupção de dados
 * - Timeout protege contra travamentos
 */

import { dbService } from '../db/db.service';

// Flag para prevenir múltiplos shutdowns simultâneos
let isShuttingDown = false;

/**
 * Executa graceful shutdown da aplicação
 *
 * Fecha todas as conexões e libera recursos
 * antes de encerrar o processo.
 *
 * @param signal - Sinal recebido (SIGTERM, SIGINT)
 */
async function gracefulShutdown(signal: string): Promise<void> {
  // Prevenir múltiplos shutdowns
  if (isShuttingDown) {
    console.log(`⚠️  Shutdown já em progresso, ignorando ${signal}`);
    return;
  }

  isShuttingDown = true;
  console.log(`🔄 Recebido sinal ${signal}. Iniciando graceful shutdown...`);

  try {
    // Timeout de 30 segundos para graceful shutdown
    const shutdownTimeout = setTimeout(() => {
      console.error('❌ Timeout no graceful shutdown. Forçando saída...');
      process.exit(1);
    }, 30000);

    // Desconectar do banco de dados
    console.log('🔄 Desconectando do banco de dados...');
    await dbService.disconnect();
    console.log('✅ Desconectado do banco de dados com sucesso');

    // Limpar timeout
    clearTimeout(shutdownTimeout);

    console.log('✅ Graceful shutdown concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Registra handlers de graceful shutdown
 *
 * Configura SIGTERM e SIGINT para encerramento limpo
 * da aplicação. Deve ser chamado no início da aplicação.
 */
export function setupGracefulShutdown(): void {
  // Handler para SIGTERM (sinal de encerramento normal)
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });

  // Handler para SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  console.log('✅ Handlers de graceful shutdown registrados');
}

