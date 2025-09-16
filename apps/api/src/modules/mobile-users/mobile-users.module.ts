import { Module } from '@nestjs/common';
import { MobileUsersService } from './mobile-users.service';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  providers: [MobileUsersService],
  exports: [MobileUsersService],
})
export class MobileUsersModule {}
