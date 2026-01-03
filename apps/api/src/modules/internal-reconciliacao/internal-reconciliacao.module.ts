import { Module } from '@nestjs/common';

import { InternalKeyGuard } from './guards/internal-key.guard';
import { InternalReconciliacaoController } from './internal-reconciliacao.controller';
import { InternalReconciliacaoService } from './internal-reconciliacao.service';
import { ReconciliacaoScheduler } from './reconciliacao.scheduler';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InternalReconciliacaoController],
  providers: [
    InternalReconciliacaoService,
    InternalKeyGuard,
    ReconciliacaoScheduler,
  ],
  exports: [InternalReconciliacaoService],
})
export class InternalReconciliacaoModule {}
