import { Module } from '@nestjs/common';

import { JustificativasController } from './justificativas.controller';
import { JustificativasService } from './justificativas.service';
import { TiposJustificativaController } from './tipos-justificativa.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TiposJustificativaController, JustificativasController],
  providers: [JustificativasService],
  exports: [JustificativasService],
})
export class JustificativasModule {}
