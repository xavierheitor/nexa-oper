/**
 * Service para gerenciar logs do client-side web
 *
 * Salva logs de erro do frontend em arquivo separado para
 * facilitar análise e debugging.
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { WebLogDto } from './dto/web-log.dto';
import { StandardLogger } from '../../common/utils/logger';

/**
 * Configuração de caminhos de log para logs do web
 */
const logPathFromEnv = process.env.LOG_PATH || './logs';
const LOG_DIR = path.resolve(logPathFromEnv);
const WEB_LOG_FILE = path.join(LOG_DIR, 'web-error.log');

/**
 * Inicialização automática do arquivo de log do web
 */
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
if (!fs.existsSync(WEB_LOG_FILE)) {
  fs.writeFileSync(WEB_LOG_FILE, '', 'utf8');
}

@Injectable()
export class WebLogsService {
  private readonly logger = new StandardLogger(WebLogsService.name);

  /**
   * Salva log de erro do client-side em arquivo separado
   *
   * @param logDto - Dados do log a ser salvo
   */
  async saveErrorLog(logDto: WebLogDto): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const context = logDto.context || 'Unknown';
      const actionType = logDto.actionType ? ` - ${logDto.actionType}` : '';
      const metadata = logDto.metadata ? `\n  Metadata: ${JSON.stringify(logDto.metadata, null, 2)}` : '';

      const logLine = `[${timestamp}] [WEB-ERROR] [${context}]${actionType} ${logDto.message}${metadata}\n`;

      // Salva no arquivo específico do web
      fs.appendFileSync(WEB_LOG_FILE, logLine, 'utf8');

      // Também loga no console para debug
      this.logger.error(`[WEB] ${logDto.message}`, undefined, context);
    } catch (error) {
      // Em caso de erro ao salvar, loga mas não quebra a aplicação
      this.logger.error('Erro ao salvar log do web', error instanceof Error ? error.stack : undefined);
    }
  }
}

