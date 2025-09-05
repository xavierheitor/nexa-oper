/**
 * Handler para Server Actions com Validação e Auditoria
 *
 * Este módulo fornece um handler centralizado para Server Actions do Next.js,
 * implementando validação automática, autenticação, auditoria e logging
 * de forma consistente em toda a aplicação.
 *
 * FUNCIONALIDADES:
 * - Validação automática de dados com Zod
 * - Verificação de autenticação obrigatória
 * - Sinalização para redirecionamento quando não autenticado
 * - Adição automática de campos de auditoria
 * - Logging completo de operações
 * - Tratamento padronizado de erros
 * - Type safety completo com TypeScript
 *
 * COMO FUNCIONA:
 * 1. Verifica se o usuário está autenticado (sinaliza redirecionamento se não)
 * 2. Valida os dados de entrada com o schema Zod
 * 3. Adiciona campos de auditoria baseado no tipo de ação
 * 4. Executa a lógica de negócio com logging
 * 5. Retorna resultado padronizado
 *
 * BENEFÍCIOS:
 * - Reduz boilerplate em Server Actions
 * - Garante consistência em toda aplicação
 * - Auditoria automática de todas as operações
 * - Validação centralizada e reutilizável
 * - Logging completo para debugging
 * - Tratamento de erros padronizado
 * - Sinalização de redirecionamento para login (UX melhorada)
 *
 * EXEMPLO DE USO:
 * ```typescript
 * export const createContrato = (rawData: unknown) =>
 *   handleServerAction(
 *     contratoCreateSchema,
 *     async (data, session) => {
 *       const service = container.get<ContratoService>('contratoService');
 *       return service.create(data, session.user.id);
 *     },
 *     rawData,
 *     { entityName: 'Contrato', actionType: 'create' }
 *   );
 * ```
 */

// Importações necessárias
import { authOptions } from '@/lib/utils/auth.config';
import { getServerSession, Session } from 'next-auth';
import { ZodSchema } from 'zod';
import type {
  ActionOptions,
  ActionResult,
  ActionType,
} from '../../types/common';
import { logger, withLogging } from '../../utils/logger';

/**
 * Handler centralizado para Server Actions
 *
 * Esta função implementa um pipeline completo para processamento de Server Actions,
 * incluindo autenticação, validação, auditoria e logging automático.
 *
 * @template TInput - Tipo dos dados de entrada validados
 * @template TOutput - Tipo dos dados de saída
 * @param schema - Schema Zod para validação dos dados de entrada
 * @param logic - Função que implementa a lógica de negócio
 * @param rawInput - Dados brutos recebidos do cliente
 * @param options - Opções de configuração da ação
 * @returns Resultado da operação com sucesso/erro padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Action simples
 * export const getContrato = (id: string) =>
 *   handleServerAction(
 *     z.object({ id: z.string() }),
 *     async (data, session) => {
 *       return await contratoService.getById(data.id);
 *     },
 *     { id },
 *     { entityName: 'Contrato', actionType: 'get' }
 *   );
 *
 * // Action com validação complexa
 * export const updateContrato = (rawData: unknown) =>
 *   handleServerAction(
 *     contratoUpdateSchema,
 *     async (data, session) => {
 *       return await contratoService.update(data, session.user.id);
 *     },
 *     rawData,
 *     { entityName: 'Contrato', actionType: 'update' }
 *   );
 * ```
 */
export async function handleServerAction<TInput, TOutput>(
  schema: ZodSchema<TInput>, // Schema para validação dos dados
  logic: (input: TInput, session: Session) => Promise<TOutput>, // Lógica de negócio
  rawInput: unknown = {}, // Dados brutos do cliente
  options?: ActionOptions // Opções de configuração
): Promise<ActionResult<TOutput>> {
  try {
    // ========================================
    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    // ========================================

    // Obtém a sessão do usuário atual
    const session = await getServerSession(authOptions);

    // Se não houver sessão, retorna erro de autenticação
    if (!session) {
      // Log da tentativa de acesso não autenticado
      logger.warn('[AuthError] Tentativa de acesso não autenticado', {
        entityName: options?.entityName || 'UNKNOWN_ENTITY',
        actionType: options?.actionType || 'unknown',
        timestamp: new Date().toISOString(),
      });

      // Retorna erro específico de autenticação
      return {
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        redirectToLogin: true,
      };
    }

    // ========================================
    // 2. VALIDAÇÃO DE DADOS
    // ========================================

    // Valida os dados de entrada usando o schema Zod
    const parseResult = schema.safeParse(rawInput);

    // Se a validação falhar, registra o erro e retorna
    if (!parseResult.success) {
      // Obtém o nome da entidade para logging contextualizado
      const entityName =
        options?.entityName || schema.description || 'UNKNOWN_ENTITY';

      // Registra erro de validação com contexto completo
      logger.error(
        `[ValidationError] Falha na validação do schema para ${entityName}`,
        {
          input: rawInput, // Dados que causaram o erro
          issues: parseResult.error.flatten(), // Detalhes dos erros de validação
        }
      );

      // Retorna erro de validação para o cliente
      return {
        success: false,
        error: parseResult.error.message, // Mensagem de erro amigável
      };
    }

    // ========================================
    // 3. PREPARAÇÃO DOS DADOS
    // ========================================

    // Obtém os dados validados
    const input = parseResult.data;

    // Obtém metadados da ação para auditoria e logging
    const entityName =
      options?.entityName || schema.description || 'UNKNOWN_ENTITY';
    const actionType = options?.actionType || 'unknown';

    // ========================================
    // 4. ADIÇÃO DE CAMPOS DE AUDITORIA
    // ========================================

    // Prepara dados de auditoria baseado no tipo de ação
    const userId = session.user.id; // ID do usuário autenticado
    const now = new Date(); // Timestamp atual

    // Adiciona campos de auditoria específicos para cada tipo de ação
    const auditFields =
      actionType === 'create'
        ? { createdBy: userId, createdAt: now } // Campos para criação
        : actionType === 'update'
          ? { updatedBy: userId, updatedAt: now } // Campos para atualização
          : actionType === 'delete'
            ? { deletedBy: userId, deletedAt: now } // Campos para exclusão
            : {}; // Sem campos de auditoria para outras ações

    // Combina dados validados com campos de auditoria
    const finalInput = { ...input, ...auditFields };

    // ========================================
    // 5. EXECUÇÃO DA LÓGICA DE NEGÓCIO
    // ========================================

    // Executa a lógica de negócio com logging automático
    const result = await withLogging(
      session, // Sessão do usuário para auditoria
      actionType as ActionType, // Tipo da ação para logging
      entityName, // Nome da entidade para contexto
      input, // Dados originais para logging
      () => logic(finalInput, session) // Função que executa a lógica
    );

    // ========================================
    // 6. RETORNO DE SUCESSO
    // ========================================

    // Retorna resultado de sucesso
    return { success: true, data: result };
  } catch (err: unknown) {
    // ========================================
    // 7. TRATAMENTO DE ERROS
    // ========================================

    // Registra erro não tratado
    logger.error(`[ServerActionError] ${err}`);

    // Retorna erro genérico para o cliente
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro interno',
    };
  }
}
