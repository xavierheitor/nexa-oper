import { Module } from '@nestjs/common';

import { LocalhostCorsGuard } from './guards/localhost-cors.guard';
import { TurnoRealizadoController } from './turno-realizado.controller';
import { TurnoRealizadoService } from './turno-realizado.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TurnoRealizadoController],
  providers: [TurnoRealizadoService, LocalhostCorsGuard],
  exports: [TurnoRealizadoService],
})
export class TurnoRealizadoModule {}
