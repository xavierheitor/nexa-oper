import { Module } from '@nestjs/common';

import { ContractsController } from './controllers/contracts.controller';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContractsController],
})
export class ContractsModule {}
