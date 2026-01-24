import { DatabaseModule } from '@database/database.module';
import { Module } from '@nestjs/common';

import { MobileUsersService } from './services/mobile-users.service';

@Module({
  imports: [DatabaseModule],
  providers: [MobileUsersService],
  exports: [MobileUsersService],
})
export class MobileUsersModule {}
