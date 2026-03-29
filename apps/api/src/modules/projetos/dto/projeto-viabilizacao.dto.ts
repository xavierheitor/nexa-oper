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

export class ProjetoProgramaResumoDto {
  @ApiProperty({ description: 'ID do programa do projeto' })
  id!: number;

  @ApiProperty({ description: 'Nome do programa do projeto' })
  nome!: string;
}

export class ProjetoUltimaViabilizacaoDto {
  @ApiProperty({ description: 'ID da viabilização' })
  id!: number;

  @ApiProperty({
    description: 'Data informada para a viabilização mais recente',
  })
  data!: string;

  @ApiProperty({
    description: 'Observação registrada na viabilização mais recente',
  })
  observacao!: string;

  @ApiProperty({ description: 'Data de criação da viabilização' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização da viabilização',
    nullable: true,
  })
  updatedAt!: Date | null;
}

export class ProjetoUltimaValidacaoViabilizacaoDto {
  @ApiProperty({ description: 'ID da validação da viabilização' })
  id!: number;

  @ApiProperty({
    description: 'Poste ao qual a validação está vinculada',
  })
  posteId!: number;

  @ApiProperty({
    description: 'Data registrada para a validação',
  })
  data!: Date;

  @ApiProperty({
    description: 'Observação registrada na validação',
    nullable: true,
  })
  observacao!: string | null;

  @ApiProperty({ description: 'Data de criação da validação' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização da validação',
    nullable: true,
  })
  updatedAt!: Date | null;
}

export class ProjetoEscopoPosteEstruturaDto {
  @ApiProperty({ description: 'ID da relação poste x estrutura' })
  id!: number;

  @ApiProperty({ description: 'ID da estrutura vinculada ao poste' })
  estruturaId!: number;
}

export class ProjetoEscopoPosteRamalDto {
  @ApiProperty({ description: 'ID da relação poste x ramal' })
  id!: number;

  @ApiProperty({ description: 'ID do tipo de ramal vinculado ao poste' })
  tipoRamalId!: number;
}

export class ProjetoEscopoPosteDto {
  @ApiProperty({ description: 'ID do poste no escopo do projeto' })
  id!: number;

  @ApiProperty({
    description: 'Viabilização que gerou a versão atual do poste',
  })
  viabilizacaoId!: number;

  @ApiProperty({
    description: 'Tipo de poste levantado',
  })
  tipoPosteId!: number;

  @ApiProperty({
    description: 'Cadastro informado para o poste',
  })
  cadastro!: string;

  @ApiProperty({
    description: 'UUID estável do poste para continuidade do levantamento',
  })
  uuid!: string;

  @ApiProperty({
    description: 'Latitude do poste no projeto',
    nullable: true,
  })
  latitude!: string | null;

  @ApiProperty({
    description: 'Longitude do poste no projeto',
    nullable: true,
  })
  longitude!: string | null;

  @ApiProperty({
    description: 'Estruturas levantadas no poste',
    type: [ProjetoEscopoPosteEstruturaDto],
  })
  estruturas!: ProjetoEscopoPosteEstruturaDto[];

  @ApiProperty({
    description: 'Ramais levantados no poste',
    type: [ProjetoEscopoPosteRamalDto],
  })
  ramais!: ProjetoEscopoPosteRamalDto[];

  @ApiProperty({
    description: 'Última validação associada ao poste',
    type: ProjetoUltimaValidacaoViabilizacaoDto,
    nullable: true,
  })
  ultimaValidacao!: ProjetoUltimaValidacaoViabilizacaoDto | null;

  @ApiProperty({ description: 'Data de criação do poste' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do poste',
    nullable: true,
  })
  updatedAt!: Date | null;
}

export class ProjetoEscopoVaoDto {
  @ApiProperty({ description: 'ID do vão no projeto' })
  id!: number;

  @ApiProperty({
    description: 'Viabilização que gerou a versão atual do vão',
  })
  viabilizacaoId!: number;

  @ApiProperty({ description: 'Poste inicial do vão' })
  posteInicioId!: number;

  @ApiProperty({ description: 'Poste final do vão' })
  posteFimId!: number;

  @ApiProperty({ description: 'Material condutor informado para o vão' })
  materialCondutorId!: number;

  @ApiProperty({ description: 'Data de criação do vão' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do vão',
    nullable: true,
  })
  updatedAt!: Date | null;
}

export class ProjetoEscopoAtualDto {
  @ApiProperty({
    description:
      'Viabilização que representa o escopo técnico atual do projeto',
    nullable: true,
  })
  viabilizacaoId!: number | null;

  @ApiProperty({
    description: 'Postes já persistidos no escopo técnico atual do projeto',
    type: [ProjetoEscopoPosteDto],
  })
  postes!: ProjetoEscopoPosteDto[];

  @ApiProperty({
    description: 'Vãos já persistidos no escopo técnico atual do projeto',
    type: [ProjetoEscopoVaoDto],
  })
  vaos!: ProjetoEscopoVaoDto[];
}

export class ProjetoParaViabilizacaoDto {
  @ApiProperty({ description: 'ID do projeto' })
  id!: number;

  @ApiProperty({
    description: 'Contrato ao qual o projeto pertence',
    type: ProjetoContratoResumoDto,
  })
  contrato!: ProjetoContratoResumoDto;

  @ApiProperty({
    description: 'Programa ao qual o projeto pertence',
    type: ProjetoProgramaResumoDto,
  })
  programa!: ProjetoProgramaResumoDto;

  @ApiProperty({ description: 'Número do projeto' })
  numeroProjeto!: string;

  @ApiProperty({ description: 'Descrição administrativa do projeto' })
  descricao!: string;

  @ApiProperty({ description: 'Equipamento do projeto' })
  equipamento!: string;

  @ApiProperty({ description: 'Município do projeto' })
  municipio!: string;

  @ApiProperty({
    description: 'Status macro atual do projeto',
    enum: [
      'PENDENTE',
      'EM_VIABILIZACAO',
      'AGUARDANDO_VALIDACAO',
      'EM_CORRECAO',
      'VIABILIZADO_PARCIAL',
      'VIABILIZADO_TOTAL',
    ],
  })
  status!: ProjetoViabilizacaoStatusContract;

  @ApiProperty({
    description:
      'TOTAL quando o projeto ainda não tem escopo persistido; PARCIAL quando já existe viabilização cadastrada para continuidade ou correção',
    enum: ['TOTAL', 'PARCIAL'],
  })
  tipoViabilizacaoPendente!: ProjetoTipoViabilizacaoPendenteContract;

  @ApiProperty({
    description: 'Última viabilização registrada para o projeto',
    type: ProjetoUltimaViabilizacaoDto,
    nullable: true,
  })
  ultimaViabilizacao!: ProjetoUltimaViabilizacaoDto | null;

  @ApiProperty({
    description: 'Última validação encontrada no escopo atual do projeto',
    type: ProjetoUltimaValidacaoViabilizacaoDto,
    nullable: true,
  })
  ultimaValidacao!: ProjetoUltimaValidacaoViabilizacaoDto | null;

  @ApiProperty({
    description:
      'Escopo técnico atual persistido para permitir continuidade da viabilização, correção ou simples reabertura do projeto no app',
    type: ProjetoEscopoAtualDto,
  })
  escopoAtual!: ProjetoEscopoAtualDto;

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
    description: 'Projetos sincronizados para o mobile',
    type: [ProjetoParaViabilizacaoDto],
  })
  items!: ProjetoParaViabilizacaoDto[];

  @ApiProperty({
    description: 'Quantidade total de projetos retornados',
  })
  total!: number;
}
