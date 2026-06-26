import { Injectable } from '@nestjs/common';

import type {
  ListProjetosParaViabilizacaoInputContract,
  ListProjetosParaViabilizacaoResponseContract,
} from '../../contracts/projeto/projeto-viabilizacao.contract';
import { PrismaService } from '../../database/prisma.service';

import { listProjetosParaViabilizacao } from './projeto-viabilizacao.query';

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  listProjetosParaViabilizacao(
    input: ListProjetosParaViabilizacaoInputContract,
  ): Promise<ListProjetosParaViabilizacaoResponseContract> {
    return listProjetosParaViabilizacao(this.prisma, input.contractIds);
  }
}
