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

export class ProjetoUltimaValidacaoViabilizacaoDto {
  @ApiProperty({ description: 'ID da validação da viabilização' })
  id!: number;

  @ApiProperty({
    description: 'Resultado da última validação registrada',
    enum: ['APROVADA', 'CORRIGIDA', 'REJEITADA'],
  })
  resultado!: 'APROVADA' | 'CORRIGIDA' | 'REJEITADA';

  @ApiProperty({
    description: 'Data em que a validação foi concluída',
  })
  validadaEm!: Date;

  @ApiProperty({
    description: 'Observação registrada na validação',
    nullable: true,
  })
  observacao!: string | null;
}

export class ProjetoEscopoPosteCadastroDto {
  @ApiProperty({ description: 'ID do cadastro mestre do poste' })
  id!: number;

  @ApiProperty({ description: 'Identificador estável do poste' })
  identificador!: string;

  @ApiProperty({ description: 'Número atual do poste na distribuidora' })
  numeroPoste!: string;
}

export class ProjetoEscopoPosteEstruturaDto {
  @ApiProperty({ description: 'ID da relação poste x estrutura' })
  id!: number;

  @ApiProperty({ description: 'Tipo de estrutura do poste' })
  tipoEstruturaId!: number;
}

export class ProjetoEscopoPosteRamalDto {
  @ApiProperty({ description: 'ID da relação poste x ramal' })
  id!: number;

  @ApiProperty({ description: 'Tipo de ramal previsto no poste' })
  tipoRamalId!: number;

  @ApiProperty({ description: 'Quantidade prevista desse tipo de ramal' })
  quantidadePrevista!: number;
}

export class ProjetoEscopoPosteDto {
  @ApiProperty({ description: 'ID do poste no escopo do projeto' })
  id!: number;

  @ApiProperty({
    description: 'Cadastro mestre associado ao poste',
    type: ProjetoEscopoPosteCadastroDto,
  })
  cadastroPoste!: ProjetoEscopoPosteCadastroDto;

  @ApiProperty({
    description: 'Viabilização que levantou a versão atual do poste',
    nullable: true,
  })
  viabilizacaoId!: number | null;

  @ApiProperty({
    description: 'Validação que aprovou a versão atual do poste',
    nullable: true,
  })
  validacaoId!: number | null;

  @ApiProperty({
    description: 'Tipo de poste levantado',
    nullable: true,
  })
  tipoPosteId!: number | null;

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
    description: 'Ordem lógica do poste no levantamento',
    nullable: true,
  })
  ordem!: number | null;

  @ApiProperty({
    description: 'Observação técnica do poste',
    nullable: true,
  })
  observacao!: string | null;

  @ApiProperty({
    description: 'Estruturas levantadas no poste',
    type: [ProjetoEscopoPosteEstruturaDto],
  })
  estruturas!: ProjetoEscopoPosteEstruturaDto[];

  @ApiProperty({
    description: 'Quantidades de ramais previstas no poste',
    type: [ProjetoEscopoPosteRamalDto],
  })
  ramaisPrevistos!: ProjetoEscopoPosteRamalDto[];
}

export class ProjetoEscopoVaoDto {
  @ApiProperty({ description: 'ID do vão no projeto' })
  id!: number;

  @ApiProperty({
    description: 'Viabilização que levantou a versão atual do vão',
    nullable: true,
  })
  viabilizacaoId!: number | null;

  @ApiProperty({
    description: 'Validação que aprovou a versão atual do vão',
    nullable: true,
  })
  validacaoId!: number | null;

  @ApiProperty({ description: 'Poste de origem do vão' })
  posteOrigemId!: number;

  @ApiProperty({ description: 'Poste de destino do vão' })
  posteDestinoId!: number;

  @ApiProperty({ description: 'Material condutor informado para o vão' })
  materialCondutorId!: number;

  @ApiProperty({
    description: 'Observação técnica do vão',
    nullable: true,
  })
  observacao!: string | null;
}

export class ProjetoEscopoAtualDto {
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
    enum: ['PENDENTE', 'EM_VIABILIZACAO', 'EM_CORRECAO', 'VIABILIZADO_PARCIAL'],
  })
  status!: ProjetoViabilizacaoStatusContract;

  @ApiProperty({
    description:
      'Tipo de viabilização ainda necessária no mobile: TOTAL para projeto ainda sem escopo persistido, PARCIAL para continuidade ou correção do levantamento já iniciado',
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
    description: 'Última validação/correção registrada para o projeto',
    type: ProjetoUltimaValidacaoViabilizacaoDto,
    nullable: true,
  })
  ultimaValidacao!: ProjetoUltimaValidacaoViabilizacaoDto | null;

  @ApiProperty({
    description:
      'Escopo técnico atual já persistido para permitir continuidade da viabilização parcial ou correção em campo',
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
    description: 'Projetos ainda elegíveis para viabilização no mobile',
    type: [ProjetoParaViabilizacaoDto],
  })
  items!: ProjetoParaViabilizacaoDto[];

  @ApiProperty({
    description: 'Quantidade total de projetos retornados',
  })
  total!: number;
}
