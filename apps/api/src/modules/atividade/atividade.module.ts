/**
 * Módulo de Atividade
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos tipos de atividade da operação, incluindo operações
 * CRUD e sincronização para clientes mobile.
 *
 * ESTRUTURA:
 * - TipoAtividadeController: Endpoints CRUD para web
 * - TipoAtividadeSyncController: Endpoints de sincronização para mobile
 * - TipoAtividadeService: Lógica de negócio centralizada
 *
 * FUNCIONALIDADES:
 * - CRUD completo de tipos de atividade
 * - Sincronização para clientes mobile
 * - Validações de negócio
 * - Integração com permissões de contrato
 * - Auditoria automática
 * - Logging estruturado
 *
 * DEPENDÊNCIAS:
 * - DatabaseModule: Acesso ao banco de dados
 * - AuthModule: Autenticação e permissões
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { TipoAtividadeService } from './services/tipo-atividade.service';
import { TipoAtividadeController, TipoAtividadeSyncController } from './controllers';

/**
 * Módulo responsável pelas operações de tipos de atividade
 *
 * CONFIGURAÇÃO:
 * - Importa DatabaseModule para acesso ao Prisma
 * - Importa AuthModule para autenticação e permissões
 * - Declara controllers para endpoints HTTP
 * - Declara services para lógica de negócio
 * - Exporta services para uso em outros módulos
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TipoAtividadeController, TipoAtividadeSyncController],
  providers: [TipoAtividadeService],
  exports: [TipoAtividadeService],
})
export class AtividadeModule {}
