import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@core/auth/auth.module';
import { Module } from '@nestjs/common';

import { EletricistaSyncController } from './controllers/eletricista-sync.controller';
import { EletricistaSyncService } from './services/eletricista-sync.service';
import { EletricistaService } from './services/eletricista.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EletricistaSyncController],
  providers: [EletricistaService, EletricistaSyncService],
  exports: [EletricistaService, EletricistaSyncService],
})
export class EletricistaModule {}
