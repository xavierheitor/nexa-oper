import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthModule } from '../engine/auth/module/auth.module';
import { EletricistaController } from './eletricista.controller';
import { EletricistaSyncController } from './eletricista-sync.controller';
import { EletricistaService } from './eletricista.service';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [EletricistaController, EletricistaSyncController],
  providers: [EletricistaService],
  exports: [EletricistaService],
})
export class EletricistaModule {}
