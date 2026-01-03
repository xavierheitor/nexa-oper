/**
 * Configuração do Swagger/OpenAPI
 *
 * Centraliza a configuração da documentação da API usando Swagger.
 */

import { StandardLogger } from '@common/utils/logger';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configura e registra o Swagger na aplicação
 *
 * Apenas habilitado em ambiente de desenvolvimento (NODE_ENV !== 'production').
 *
 * @param app - Instância da aplicação NestJS
 * @param logger - Logger para registrar mensagens
 */
export function configureSwagger(
  app: INestApplication,
  logger: StandardLogger
): void {
  // Swagger só fora de produção
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Nexa Oper API')
    .setDescription('API para gerenciamento de operações da Nexa')
    .setVersion('1.0')
    .addTag('apr', 'Análise Preliminar de Risco')
    .addTag('checklist', 'Checklists de Segurança')
    .addTag('database', 'Operações de Banco de Dados')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  logger.log('Documentação Swagger disponível em /api/docs');
}
