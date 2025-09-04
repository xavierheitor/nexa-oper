/**
 * API Route para Logging Remoto
 *
 * Este endpoint permite que componentes do frontend enviem logs
 * para o servidor, que por sua vez os registra no sistema de logging
 * centralizado da aplicação.
 *
 * FUNCIONALIDADES:
 * - Recebe logs do frontend via HTTP POST
 * - Suporta múltiplos níveis de log (info, warn, error, action, access)
 * - Valida dados de entrada
 * - Trata erros de forma robusta
 * - Integra com o sistema de logging centralizado
 *
 * COMO FUNCIONA:
 * 1. Frontend envia POST com dados do log
 * 2. API valida se message é obrigatório
 * 3. Determina o nível do log baseado no type
 * 4. Chama o logger apropriado com message e meta
 * 5. Retorna resposta de sucesso ou erro
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * await fetch('/api/log', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     type: 'error',
 *     message: 'Erro ao carregar dados',
 *     meta: { userId: '123', component: 'UserList' }
 *   })
 * });
 * ```
 *
 * BENEFÍCIOS:
 * - Logging centralizado do frontend
 * - Rastreamento de erros do cliente
 * - Auditoria de ações do usuário
 * - Debugging facilitado
 * - Monitoramento em tempo real
 */

// Importações necessárias para a API route
import { logger } from '@/lib/utils/logger'; // Sistema de logging centralizado
import type { NextRequest } from 'next/server'; // Tipo para requisições Next.js
import { NextResponse } from 'next/server'; // Classe para respostas Next.js

/**
 * Handler para requisições POST na rota /api/log
 *
 * Processa logs enviados pelo frontend e os registra no sistema
 * de logging centralizado da aplicação.
 *
 * @param req - Objeto da requisição HTTP
 * @returns Resposta JSON com status de sucesso ou erro
 */
export async function POST(req: NextRequest) {
  try {
    // Extrai dados do corpo da requisição
    const body = await req.json();
    const { type = 'info', message, meta } = body;

    // Validação: message é obrigatório
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Switch para determinar o nível de log baseado no type
    switch (type) {
      case 'info':
        logger.info(message, meta); // Log de informação geral
        break;
      case 'warn':
        logger.warn(message, meta); // Log de aviso
        break;
      case 'error':
        logger.error(message, meta); // Log de erro
        break;
      case 'action':
        logger.action(message, meta); // Log de ação do usuário
        break;
      case 'access':
        logger.access(message, meta); // Log de acesso
        break;
      default:
        // Se type não for reconhecido, usa info como padrão
        logger.info(message, meta);
        break;
    }

    // Retorna sucesso
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log do erro interno (não deve falhar)
    logger.error('Erro ao registrar log pela API', { error });

    // Retorna erro interno do servidor
    return NextResponse.json(
      { error: 'Erro interno ao registrar log' },
      { status: 500 }
    );
  }
}
