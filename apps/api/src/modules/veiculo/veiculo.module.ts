import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { VeiculoSyncController } from './controllers/veiculo-sync.controller';
import { VeiculoController } from './controllers/veiculo.controller';
import { VeiculoService } from './services/veiculo.service';

/**
 * Módulo de Veículos
 *
 * Centraliza todos os componentes responsáveis pela gestão
 * de veículos na API, incluindo CRUD, sincronização e
 * integração com permissões de contrato.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [VeiculoSyncController, VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}
