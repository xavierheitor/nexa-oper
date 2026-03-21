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
      'Retorna apenas projetos que ainda precisam de viabilização total ou complementar. Projetos totalmente viabilizados não são enviados ao app.',
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
