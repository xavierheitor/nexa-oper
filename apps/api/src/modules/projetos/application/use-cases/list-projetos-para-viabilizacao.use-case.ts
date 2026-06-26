import { Injectable } from '@nestjs/common';

import type {
  ListProjetosParaViabilizacaoInputContract,
  ListProjetosParaViabilizacaoResponseContract,
} from '../../../../contracts/projeto/projeto-viabilizacao.contract';
import { ProjetosService } from '../../projetos.service';

@Injectable()
export class ListProjetosParaViabilizacaoUseCase {
  constructor(private readonly projetosService: ProjetosService) {}

  execute(
    input: ListProjetosParaViabilizacaoInputContract,
  ): Promise<ListProjetosParaViabilizacaoResponseContract> {
    return this.projetosService.listProjetosParaViabilizacao(input);
  }
}
