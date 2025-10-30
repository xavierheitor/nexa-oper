/**
 * Middleware de Logging para Requisições HTTP
 *
 * Este middleware intercepta todas as requisições HTTP que passam pela aplicação,
 * registrando informações detalhadas sobre requests e responses para facilitar
 * o debugging, monitoramento e auditoria do sistema.
 *
 * FUNCIONALIDADES:
 * - Log detalhado de requisições (método, URL, headers, body)
 * - Log detalhado de respostas (status, tempo de resposta, dados retornados)
 * - Medição de tempo de processamento de cada requisição
 * - Parsing seguro de dados JSON para logging
 * - Emojis para facilitar identificação visual nos logs
 *
 * APLICAÇÃO:
 * - Configurado globalmente no AppModule para todas as rotas
 * - Executa antes dos controllers e após os guards/interceptors
 * - Não interfere no fluxo normal da aplicação
 *
 * ESTRUTURA DOS LOGS:
 * - 📥 Request: Dados da requisição recebida
 * - 📤 Response: Dados da resposta enviada + tempo de processamento
 *
 * @example
 * ```typescript
 * // Configuração no AppModule
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer): void {
 *     consumer.apply(LoggerMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.nestjs.com/middleware} - Documentação oficial sobre Middlewares
 * @author Nexa Oper Team
 * @since 1.0.0
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../../metrics/metrics.service';
import { sanitizeHeaders, sanitizeData } from '../utils/logger';

/**
 * Middleware responsável pelo logging automático de requisições HTTP.
 *
 * Implementa a interface NestMiddleware do NestJS para interceptar
 * todas as requisições e respostas HTTP, registrando informações
 * detalhadas para debugging e monitoramento.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);
  constructor(private readonly metricsService?: MetricsService) {}
  /**
   * Método principal do middleware que intercepta requisições HTTP.
   *
   * Este método é chamado automaticamente pelo NestJS para cada requisição
   * que passa pela aplicação. Ele registra os dados da requisição,
   * intercepta a resposta para medir tempo de processamento e registra
   * os dados da resposta antes de enviá-la ao cliente.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Captura dados da requisição (método, URL, headers, body)
   * 2. Registra timestamp de início para medição de tempo
   * 3. Loga informações da requisição recebida
   * 4. Intercepta o método res.send() para capturar a resposta
   * 5. Quando a resposta é enviada, calcula tempo decorrido
   * 6. Loga informações da resposta (status, tempo, dados)
   * 7. Envia a resposta original ao cliente
   *
   * @param req - Objeto Request do Express contendo dados da requisição
   * @param res - Objeto Response do Express para envio da resposta
   * @param next - Função NextFunction para continuar o pipeline de middleware
   *
   * @example
   * ```typescript
   * // Log de exemplo gerado:
   * // 📥 Request: {
   * //   method: 'GET',
   * //   url: '/api/users',
   * //   headers: { 'content-type': 'application/json' },
   * //   body: {}
   * // }
   * // 📤 Response: {
   * //   url: '/api/users',
   * //   status: 200,
   * //   time: '45ms',
   * //   response: { data: [...], total: 10 }
   * // }
   * ```
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Extrai informações relevantes da requisição
    const { method, originalUrl, headers, body } = req;

    // Marca o timestamp de início para cálculo de tempo de resposta
    const startTime = Date.now();

    // Registra informações detalhadas da requisição recebida
    // Sanitiza headers e body para evitar exposição de informações sensíveis
    this.logger.log('📥 Request:', {
      method,
      url: originalUrl,
      headers: sanitizeHeaders(headers),
      body: sanitizeData(body),
    });

    // Intercepta o método send() da resposta para capturar dados de saída
    const originalSend = res.send.bind(res);

    /**
     * Substitui temporariamente o método send() do Response
     * para interceptar e logar dados antes do envio ao cliente
     */
    res.send = (data: any) => {
      // Calcula tempo total de processamento da requisição
      const elapsed = Date.now() - startTime;

      // Registra informações detalhadas da resposta
      // Sanitiza dados da resposta para evitar exposição de informações sensíveis
      const responseData = this.tryParseJson(data);
      this.logger.log('📤 Response:', {
        url: originalUrl,
        status: res.statusCode,
        time: `${elapsed}ms`,
        response: sanitizeData(responseData),
      });

      // Chama o método send() original para enviar a resposta
      try {
        const route = originalUrl.split('?')[0] || originalUrl;
        this.metricsService?.observeRequest(method, route, res.statusCode, elapsed / 1000);
      } catch {}
      return originalSend(data);
    };

    // Continua para o próximo middleware/controller no pipeline
    next();
  }

  /**
   * Método utilitário para parsing seguro de dados JSON.
   *
   * Tenta fazer o parse de uma string JSON de forma segura,
   * retornando o objeto parseado em caso de sucesso ou os
   * dados originais em caso de erro de parsing.
   *
   * Útil para logar dados de resposta que podem estar em
   * formato string JSON ou já serem objetos JavaScript.
   *
   * @param data - Dados a serem parseados (string JSON ou qualquer outro tipo)
   * @returns Objeto parseado se for JSON válido, ou dados originais caso contrário
   *
   * @example
   * ```typescript
   * // String JSON válida
   * this.tryParseJson('{"name": "João"}') // Retorna: { name: "João" }
   *
   * // String não-JSON
   * this.tryParseJson('Hello World') // Retorna: "Hello World"
   *
   * // Objeto já parseado
   * this.tryParseJson({ id: 1 }) // Retorna: { id: 1 }
   *
   * // JSON inválido
   * this.tryParseJson('{"invalid": json}') // Retorna: '{"invalid": json}'
   * ```
   *
   * @private
   */
  private tryParseJson(data: any): any {
    try {
      // Tenta fazer o parse JSON dos dados
      return JSON.parse(data);
    } catch {
      // Em caso de erro, retorna os dados originais
      return data;
    }
  }
}
