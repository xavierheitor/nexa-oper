import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AprController } from './apr.controller';
import { AprService } from './apr.service';

@Module({
  imports: [DbModule],
  providers: [AprService],
  exports: [AprService],
  controllers: [AprController],
})
export class AprModule {}
