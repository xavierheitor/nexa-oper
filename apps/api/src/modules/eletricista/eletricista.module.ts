import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { EletricistaSyncController } from './controllers/eletricista-sync.controller';
import { EletricistaController } from './controllers/eletricista.controller';
import { EletricistaService } from './services/eletricista.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EletricistaSyncController, EletricistaController],
  providers: [EletricistaService],
  exports: [EletricistaService],
})
export class EletricistaModule {}
