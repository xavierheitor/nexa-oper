import { Module } from '@nestjs/common';
import { TurnoRealizadoController } from './turno-realizado.controller';
import { TurnoRealizadoService } from './turno-realizado.service';
import { TurnoReconciliacaoService } from './turno-reconciliacao.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TurnoRealizadoController],
  providers: [TurnoRealizadoService, TurnoReconciliacaoService],
  exports: [TurnoRealizadoService, TurnoReconciliacaoService],
})
export class TurnoRealizadoModule {}


