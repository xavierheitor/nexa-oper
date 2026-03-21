import { ApiProperty } from '@nestjs/swagger';

import type {
  ProjetoTipoViabilizacaoPendenteContract,
  ProjetoViabilizacaoStatusContract,
} from '../../../contracts/projeto/projeto-viabilizacao.contract';

export class ProjetoContratoResumoDto {
  @ApiProperty({ description: 'ID do contrato' })
  id!: number;

  @ApiProperty({ description: 'Nome do contrato' })
  nome!: string;

  @ApiProperty({ description: 'Número do contrato' })
  numero!: string;
}

export class ProjetoUltimaViabilizacaoDto {
  @ApiProperty({ description: 'ID da viabilização' })
  id!: number;

  @ApiProperty({
    description: 'Resultado da última viabilização registrada',
    enum: ['PARCIAL', 'TOTAL'],
  })
  resultado!: 'PARCIAL' | 'TOTAL';

  @ApiProperty({
    description: 'Data da coleta em campo',
    nullable: true,
  })
  dataViabilizacao!: Date | null;

  @ApiProperty({
    description: 'Data em que a viabilização foi enviada pelo app',
    nullable: true,
  })
  enviadaEm!: Date | null;

  @ApiProperty({
    description: 'Observação registrada na última viabilização',
    nullable: true,
  })
  observacao!: string | null;
}

export class ProjetoParaViabilizacaoDto {
  @ApiProperty({ description: 'ID do projeto' })
  id!: number;

  @ApiProperty({
    description: 'Contrato ao qual o projeto pertence',
    type: ProjetoContratoResumoDto,
  })
  contrato!: ProjetoContratoResumoDto;

  @ApiProperty({ description: 'Número do projeto' })
  numeroProjeto!: string;

  @ApiProperty({ description: 'Descrição administrativa do projeto' })
  descricao!: string;

  @ApiProperty({ description: 'Equipamento do projeto' })
  equipamento!: string;

  @ApiProperty({ description: 'Município do projeto' })
  municipio!: string;

  @ApiProperty({
    description: 'Observações administrativas do projeto',
    nullable: true,
  })
  observacao!: string | null;

  @ApiProperty({
    description: 'Status macro atual do projeto',
    enum: ['PENDENTE', 'EM_VIABILIZACAO', 'VIABILIZADO_PARCIAL'],
  })
  status!: ProjetoViabilizacaoStatusContract;

  @ApiProperty({
    description:
      'Tipo de viabilização ainda necessária no mobile: TOTAL para projeto ainda não viabilizado por completo, PARCIAL para complemento de escopo',
    enum: ['TOTAL', 'PARCIAL'],
  })
  tipoViabilizacaoPendente!: ProjetoTipoViabilizacaoPendenteContract;

  @ApiProperty({
    description: 'Última viabilização registrada para o projeto',
    type: ProjetoUltimaViabilizacaoDto,
    nullable: true,
  })
  ultimaViabilizacao!: ProjetoUltimaViabilizacaoDto | null;

  @ApiProperty({ description: 'Data de criação do projeto' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do projeto',
    nullable: true,
  })
  updatedAt!: Date | null;
}

export class ListProjetosParaViabilizacaoResponseDto {
  @ApiProperty({
    description: 'Projetos ainda elegíveis para viabilização no mobile',
    type: [ProjetoParaViabilizacaoDto],
  })
  items!: ProjetoParaViabilizacaoDto[];

  @ApiProperty({
    description: 'Quantidade total de projetos retornados',
  })
  total!: number;
}
