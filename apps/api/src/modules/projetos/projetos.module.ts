import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database';
import { ContractPermissionsModule } from '../auth/modules/contract-permissions/contract-permissions.module';

import { ListProjetosParaViabilizacaoUseCase } from './application/use-cases/list-projetos-para-viabilizacao.use-case';
import { ProjetosController } from './projetos.controller';
import { ProjetosService } from './projetos.service';

@Module({
  imports: [DatabaseModule, ContractPermissionsModule],
  controllers: [ProjetosController],
  providers: [ProjetosService, ListProjetosParaViabilizacaoUseCase],
})
export class ProjetosModule {}
