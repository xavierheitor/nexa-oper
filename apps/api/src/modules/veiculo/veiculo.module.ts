import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthModule } from '../engine/auth/module/auth.module';
import { VeiculoController } from './veiculo.controller';
import { VeiculoSyncController } from './veiculo-sync.controller';
import { VeiculoService } from './veiculo.service';

/**
 * Módulo de Veículos
 *
 * Centraliza todos os componentes responsáveis pela gestão
 * de veículos na API, incluindo CRUD, sincronização e
 * integração com permissões de contrato.
 */
@Module({
  imports: [DbModule, AuthModule],
  controllers: [VeiculoSyncController, VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}
