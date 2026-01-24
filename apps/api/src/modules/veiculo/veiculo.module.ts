import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@core/auth/auth.module';
import { Module } from '@nestjs/common';

import {
  VeiculoController,
  VeiculoSyncController,
  TipoVeiculoController,
  TipoVeiculoSyncController,
} from './controllers';
import { TipoVeiculoService } from './services/tipo-veiculo.service';
import { VeiculoService } from './services/veiculo.service';

/**
 * Módulo de Veículos
 *
 * - VeiculoController, VeiculoSyncController: CRUD e sync de veículos.
 * - TipoVeiculoController, TipoVeiculoSyncController: CRUD e sync de tipos de veículo.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    VeiculoSyncController,
    VeiculoController,
    TipoVeiculoController,
    TipoVeiculoSyncController,
  ],
  providers: [VeiculoService, TipoVeiculoService],
  exports: [VeiculoService, TipoVeiculoService],
})
export class VeiculoModule {}
