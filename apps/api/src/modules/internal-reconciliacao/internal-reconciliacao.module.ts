import { Module } from '@nestjs/common';
import { InternalReconciliacaoController } from './internal-reconciliacao.controller';
import { InternalReconciliacaoService } from './internal-reconciliacao.service';
import { InternalKeyGuard } from './guards/internal-key.guard';
import { DatabaseModule } from '../../database/database.module';
import { ReconciliacaoScheduler } from './reconciliacao.scheduler';

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
