import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TiposJustificativaController } from './tipos-justificativa.controller';
import { JustificativasController } from './justificativas.controller';
import { JustificativasService } from './justificativas.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TiposJustificativaController, JustificativasController],
  providers: [JustificativasService],
  exports: [JustificativasService],
})
export class JustificativasModule {}


