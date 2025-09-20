import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { EletricistaController } from './controllers/eletricista.controller';
import { EletricistaSyncController } from './controllers/eletricista-sync.controller';
import { EletricistaService } from './services/eletricista.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EletricistaSyncController, EletricistaController],
  providers: [EletricistaService],
  exports: [EletricistaService],
})
export class EletricistaModule {}
