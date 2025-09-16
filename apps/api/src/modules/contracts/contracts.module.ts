import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { AuthModule } from '../auth/module/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContractsController],
})
export class ContractsModule {}
