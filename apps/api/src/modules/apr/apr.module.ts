import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthModule } from '../auth/module/auth.module';
import { AprController } from './apr.controller';
import { AprService } from './apr.service';

@Module({
  imports: [DbModule, AuthModule],
  providers: [AprService],
  exports: [AprService],
  controllers: [AprController],
})
export class AprModule {}
