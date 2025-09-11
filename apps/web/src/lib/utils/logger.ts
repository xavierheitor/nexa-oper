/**
 * Sistema de Logging Personalizado
 *
 * Este módulo fornece um sistema completo de logging para a aplicação,
 * incluindo diferentes níveis de log, persistência em arquivos e
 * integração com sessões de usuário para auditoria.
 *
 * FUNCIONALIDADES:
 * - Múltiplos níveis de log (info, warn, error, action, access)
 * - Persistência em arquivos (app.log e error.log)
 * - Formatação padronizada com timestamp e contexto
 * - Logging automático de ações de usuário
 * - Separação de logs de erro em arquivo específico
 * - Integração com NextAuth para auditoria
 *
 * COMO FUNCIONA:
 * 1. Configura diretórios e arquivos de log automaticamente
 * 2. Formata logs com timestamp, nível e contexto
 * 3. Escreve logs em arquivos separados por tipo
 * 4. Fornece funções helper para diferentes níveis
 * 5. Inclui wrapper para logging automático de ações
 *
 * ESTRUTURA DE ARQUIVOS:
 * - ./logs/app.log - Todos os logs da aplicação
 * - ./logs/error.log - Apenas logs de erro
 *
 * SEGURANÇA E AUDITORIA:
 * - Logs de ações incluem ID do usuário
 * - Contexto completo de entrada e saída
 * - Rastreamento de sucesso/falha de operações
 * - Timestamps precisos para auditoria
 */

// Importações necessárias para o sistema de logging
import fs from 'fs'; // Sistema de arquivos do Node.js
import { Session } from 'next-auth'; // Tipos de sessão do NextAuth
import path from 'path'; // Utilitários de caminho
import { ACTION_TYPE_LABELS } from '../types/common'; // Labels para ActionTypes

// Configuração de caminhos de log
const logPathFromEnv = process.env.LOG_PATH || './logs'; // Caminho configurável via env
const LOG_DIR = path.resolve(logPathFromEnv); // Diretório absoluto dos logs
const LOG_FILE = path.join(LOG_DIR, 'app.log'); // Arquivo principal de logs
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log'); // Arquivo específico para erros

// Inicialização automática dos arquivos de log
// Garante que o diretório e arquivos existem antes de usar
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true }); // Cria diretório recursivamente
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '', 'utf8'); // Cria arquivo principal vazio
}
if (!fs.existsSync(ERROR_LOG_FILE)) {
  fs.writeFileSync(ERROR_LOG_FILE, '', 'utf8'); // Cria arquivo de erros vazio
}

/**
 * Tipos de níveis de log disponíveis
 *
 * - info: Informações gerais da aplicação
 * - warn: Avisos que não impedem funcionamento
 * - error: Erros que afetam funcionalidade
 * - action: Ações específicas de usuário (CRUD)
 * - access: Acessos e autenticações
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'action' | 'access';

/**
 * Interface para payload de log
 *
 * Define a estrutura dos dados que podem ser enviados para o logger
 */
interface LogPayload {
  level?: LogLevel; // Nível do log (padrão: 'info')
  message: string; // Mensagem principal do log
  context?: Record<string, any>; // Contexto adicional (objeto JSON)
}

/**
 * Função para formatar logs
 *
 * Cria uma string padronizada com timestamp, nível e contexto
 *
 * @param payload - Dados do log a serem formatados
 * @returns String formatada para escrita no arquivo
 */
function formatLog({ level = 'info', message, context }: LogPayload): string {
  const timestamp = new Date().toISOString(); // Timestamp ISO
  const ctx = context ? ` | ${JSON.stringify(context)}` : ''; // Contexto JSON
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

/**
 * Função para escrever logs em arquivos
 *
 * Escreve o log formatado no arquivo apropriado baseado no nível
 *
 * @param line - Linha formatada para escrita
 * @param level - Nível do log para determinar arquivo de destino
 */
function writeLog(line: string, level: LogLevel = 'info') {
  // Escreve sempre no arquivo principal
  fs.appendFile(LOG_FILE, line + '\n', err => {
    if (err) console.error('Erro ao escrever log:', err);
  });

  // Se for erro, escreve também no arquivo específico de erros
  if (level === 'error') {
    fs.appendFile(ERROR_LOG_FILE, line + '\n', err => {
      if (err) console.error('Erro ao escrever error.log:', err);
    });
  }
}

/**
 * Objeto logger principal
 *
 * Fornece métodos convenientes para diferentes níveis de log
 * e gerencia a escrita automática em arquivos
 */
export const logger = {
  /**
   * Método principal de logging
   *
   * @param payload - Dados do log a serem processados
   */
  log(payload: LogPayload) {
    const line = formatLog(payload); // Formata o log
    writeLog(line, payload.level); // Escreve no arquivo

    // Se for erro, mostra também no console para debug
    if (payload.level === 'error') {
      console.error(line); // 🔥 Mostra erro também no console
    }
  },

  // Métodos helper para diferentes níveis de log
  info: (message: string, context?: Record<string, any>) =>
    logger.log({ level: 'info', message, context }),
  warn: (message: string, context?: Record<string, any>) =>
    logger.log({ level: 'warn', message, context }),
  error: (message: string, context?: Record<string, any>) =>
    logger.log({ level: 'error', message, context }),
  action: (message: string, context?: Record<string, any>) =>
    logger.log({ level: 'action', message, context }),
  access: (message: string, context?: Record<string, any>) =>
    logger.log({ level: 'access', message, context }),
};

/**
 * Função wrapper para logging automático de ações
 *
 * Esta função envolve operações de banco de dados e outras ações
 * para registrar automaticamente o sucesso ou falha, incluindo
 * informações de auditoria como ID do usuário.
 *
 * @param session - Sessão do usuário para auditoria
 * @param actionType - Tipo da ação (create, update, delete, get, list)
 * @param entity - Nome da entidade sendo manipulada
 * @param input - Dados de entrada da operação
 * @param logic - Função que executa a lógica real
 * @returns Resultado da operação ou lança erro
 */
export async function withLogging<T>(
  session: Session,
  actionType: string, // Aceita qualquer string para flexibilidade total
  entity: string,
  input: unknown,
  logic: () => Promise<T>
): Promise<T> {
  // Usa label amigável ou o tipo original
  const actionLabel = ACTION_TYPE_LABELS[actionType] || actionType;

  try {
    // Executa a lógica real
    const result = await logic();

    // Log de sucesso com contexto completo
    logger.action(`[${actionLabel.toUpperCase()}] ${entity}`, {
      userId: session.user.id, // ID do usuário para auditoria
      actionType, // Tipo original da ação
      input, // Dados de entrada
      output: result, // Resultado da operação
      success: true, // Flag de sucesso
    });

    return result;
  } catch (error) {
    // Log de erro com contexto de falha
    logger.error(`[${actionLabel.toUpperCase()}] ${entity} FAILED`, {
      userId: session.user.id, // ID do usuário para auditoria
      actionType, // Tipo original da ação
      input, // Dados de entrada que causaram erro
      success: false, // Flag de falha
      error: error instanceof Error ? error.message : String(error), // Mensagem de erro
    });

    // Re-lança o erro para não quebrar o fluxo da aplicação
    throw error;
  }
}

// TODO: Implementar hook useLogger para componentes React
// TODO: Migrar todos os tipos e definições para uma pasta types
// TODO: Adicionar documentação de arquitetura do sistema de logging
