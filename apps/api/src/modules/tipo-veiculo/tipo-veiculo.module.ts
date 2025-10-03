import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { TipoVeiculoController } from './controllers/tipo-veiculo.controller';
import { TipoVeiculoSyncController } from './controllers/tipo-veiculo-sync.controller';
import { TipoVeiculoService } from './services/tipo-veiculo.service';

/**
 * Módulo de Tipos de Veículo
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos tipos de veículo, incluindo CRUD e sincronização.
 *
 * CONTROLLERS:
 * - TipoVeiculoController: Operações CRUD (listagem paginada, criação, atualização, exclusão)
 * - TipoVeiculoSyncController: Sincronização para clientes mobile
 *
 * SERVICES:
 * - TipoVeiculoService: Lógica de negócio centralizada
 *
 * IMPORTS:
 * - DatabaseModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [TipoVeiculoService],
  exports: [TipoVeiculoService],
  controllers: [TipoVeiculoSyncController, TipoVeiculoController],
})
export class TipoVeiculoModule {}
