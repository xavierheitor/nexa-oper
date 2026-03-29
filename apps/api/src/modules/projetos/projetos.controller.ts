import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { ListProjetosParaViabilizacaoResponseContract } from '../../contracts/projeto/projeto-viabilizacao.contract';
import { GetUserContracts } from '../auth/modules/contract-permissions/decorators/get-user-contracts.decorator';
import { InjectUserContracts } from '../auth/modules/contract-permissions/decorators/inject-user-contracts.decorator';

import { ListProjetosParaViabilizacaoUseCase } from './application/use-cases/list-projetos-para-viabilizacao.use-case';
import { ListProjetosParaViabilizacaoResponseDto } from './dto/projeto-viabilizacao.dto';

@ApiTags('projetos')
@ApiBearerAuth()
@Controller('mobile/projetos')
@InjectUserContracts()
export class ProjetosController {
  constructor(
    private readonly listProjetosParaViabilizacaoUseCase: ListProjetosParaViabilizacaoUseCase,
  ) {}

  @Get('viabilizacao')
  @ApiOperation({
    summary: 'Listar projetos pendentes de viabilização no mobile',
    description:
      'Retorna os projetos sincronizados para o fluxo de viabilização no mobile, incluindo pendentes, em andamento, aguardando validação, em correção e já viabilizados. Quando existir viabilização cadastrada, o payload inclui o escopo técnico persistido da última viabilização para continuidade do levantamento.',
  })
  @ApiOkResponse({
    description:
      'Lista de projetos elegíveis para viabilização, já filtrada pelos contratos do usuário autenticado.',
    type: ListProjetosParaViabilizacaoResponseDto,
  })
  listProjetosParaViabilizacao(
    @GetUserContracts() contractIds: number[],
  ): Promise<ListProjetosParaViabilizacaoResponseContract> {
    return this.listProjetosParaViabilizacaoUseCase.execute({ contractIds });
  }
}
