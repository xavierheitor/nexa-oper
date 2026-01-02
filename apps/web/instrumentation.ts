/**
 * Instrumentação da Aplicação Next.js
 *
 * Este arquivo é executado automaticamente pelo Next.js quando a aplicação
 * inicia em modo servidor. É usado para configurações globais e inicialização
 * de módulos necessários antes do servidor começar a processar requisições.
 *
 * FUNCIONALIDADES:
 * - Registra handlers de graceful shutdown
 * - Configuração de runtime global
 * - Inicialização de serviços
 *
 * COMO FUNCIONA:
 * 1. Next.js executa este arquivo na inicialização
 * 2. Registra handlers de shutdown
 * 3. Configura serviços globais
 * 4. Retorna configurações de runtime
 */

/**
 * Exporta configuração de instrumentação
 *
 * Esta função é executada automaticamente pelo Next.js no startup do servidor.
 * Registra handlers de graceful shutdown para encerramento limpo da aplicação.
 */
export async function register() {
  // Apenas no servidor (não no cliente)
  if (typeof window === 'undefined') {
    const { setupGracefulShutdown } = await import('./src/lib/utils/shutdown');
    setupGracefulShutdown();

    // Inicializar scheduler de tarefas agendadas
    const { schedulerService } = await import('./src/lib/services/scheduler.service');
    schedulerService.initialize();
  }
}

