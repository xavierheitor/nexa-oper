/**
 * Módulo Nest responsável por agrupar controller e service de escalas.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { EscalaController } from './controllers';
import { EscalaService } from './services/escala.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EscalaController],
  providers: [EscalaService],
  exports: [EscalaService],
})
export class EscalaModule {}
