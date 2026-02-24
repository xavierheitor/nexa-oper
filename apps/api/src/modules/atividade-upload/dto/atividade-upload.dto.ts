import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AtividadeUploadPhotoDto {
  @ApiPropertyOptional({ example: 'resposta-1' })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiProperty({
    description:
      'Conteúdo em base64 (aceita formato puro ou data URL: data:image/jpeg;base64,...)',
  })
  @IsString()
  @IsNotEmpty()
  base64!: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 'foto.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  capturedAt?: string;

  @ApiPropertyOptional({ example: 'form:pergunta-1' })
  @IsOptional()
  @IsString()
  contexto?: string;
}

export class AtividadeUploadMedidorDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  somenteRetirada?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instaladoNumero?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  instaladoPhotoId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instaladoPhotoRef?: string | null;

  @ApiPropertyOptional({ type: AtividadeUploadPhotoDto })
  @Type(() => AtividadeUploadPhotoDto)
  @IsOptional()
  @ValidateNested()
  instaladoFoto?: AtividadeUploadPhotoDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  retiradoStatus?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  retiradoNumero?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  retiradoLeitura?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  retiradoPhotoId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  retiradoPhotoRef?: string | null;

  @ApiPropertyOptional({ type: AtividadeUploadPhotoDto })
  @Type(() => AtividadeUploadPhotoDto)
  @IsOptional()
  @ValidateNested()
  retiradoFoto?: AtividadeUploadPhotoDto | null;
}

export class AtividadeUploadMaterialDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  materialCatalogoRemoteId?: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  materialCodigo!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  materialDescricao!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unidadeMedida!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  quantidade!: number;
}

export class AtividadeUploadRespostaDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  perguntaRemoteId?: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  perguntaChave!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  perguntaTituloSnapshot!: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  ordem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  respostaTexto?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  obrigaFotoSnapshot?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  fotoId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fotoRef?: string | null;

  @ApiPropertyOptional({ type: AtividadeUploadPhotoDto })
  @Type(() => AtividadeUploadPhotoDto)
  @IsOptional()
  @ValidateNested()
  foto?: AtividadeUploadPhotoDto | null;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  dataResposta?: string;
}

export class AtividadeUploadEventoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoEvento!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  locationTrackId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  accuracy?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detalhe?: string | null;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  capturadoEm?: string;
}

export class AtividadeUploadAprRespostaDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  aprGrupoPerguntaId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aprGrupoPerguntaNomeSnapshot?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  aprPerguntaId?: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  aprPerguntaNomeSnapshot!: string;

  @ApiProperty({ example: 'checkbox' })
  @IsString()
  @IsNotEmpty()
  tipoRespostaSnapshot!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  aprOpcaoRespostaId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aprOpcaoRespostaNomeSnapshot?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  respostaTexto?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marcado?: boolean | null;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  ordemGrupo?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  ordemPergunta?: number;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  dataResposta?: string;
}

export class AtividadeUploadAprAssinaturaDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  turnoEletricistaId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  eletricistaId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomeAssinante?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matriculaAssinante?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assinaturaHash?: string | null;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  assinaturaData?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  assinanteExtra?: boolean;
}

export class AtividadeUploadAprDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  aprUuid!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  aprRemoteId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  aprModeloId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  turnoId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tipoAtividadeRemoteId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tipoServicoRemoteId?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  vinculadaAoServico?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @ApiPropertyOptional({ example: '2026-02-21T20:00:00.000Z' })
  @IsOptional()
  @IsString()
  preenchidaEm?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiProperty({ type: [AtividadeUploadAprRespostaDto] })
  @Type(() => AtividadeUploadAprRespostaDto)
  @IsArray()
  @ValidateNested({ each: true })
  respostas!: AtividadeUploadAprRespostaDto[];

  @ApiProperty({ type: [AtividadeUploadAprAssinaturaDto] })
  @Type(() => AtividadeUploadAprAssinaturaDto)
  @IsArray()
  @ValidateNested({ each: true })
  assinaturas!: AtividadeUploadAprAssinaturaDto[];
}

export class AtividadeUploadDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  atividadeUuid!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  atividadeRemoteId?: number | null;

  @ApiProperty({ example: 5541 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnoId!: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tipoAtividadeRemoteId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoAtividadeNome?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tipoServicoRemoteId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoServicoNome?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  atividadeFormTemplateId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoLigacao?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroDocumento?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplicaMedidor?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplicaRamal?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplicaMaterial?: boolean;

  @ApiPropertyOptional({ example: 'em_execucao' })
  @IsOptional()
  @IsString()
  statusFluxo?: string;

  @ApiPropertyOptional({ example: 'identificacao' })
  @IsOptional()
  @IsString()
  etapaAtual?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aprPreenchidaEm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  finalizadaEm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoesFinalizacao?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataCriacao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataModificacao?: string;

  @ApiPropertyOptional({ type: AtividadeUploadMedidorDto })
  @Type(() => AtividadeUploadMedidorDto)
  @IsOptional()
  @ValidateNested()
  medidor?: AtividadeUploadMedidorDto | null;

  @ApiPropertyOptional({ type: [AtividadeUploadMaterialDto] })
  @Type(() => AtividadeUploadMaterialDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  materiais?: AtividadeUploadMaterialDto[];

  @ApiPropertyOptional({ type: [AtividadeUploadRespostaDto] })
  @Type(() => AtividadeUploadRespostaDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  respostas?: AtividadeUploadRespostaDto[];

  @ApiPropertyOptional({ type: [AtividadeUploadEventoDto] })
  @Type(() => AtividadeUploadEventoDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  eventos?: AtividadeUploadEventoDto[];

  @ApiPropertyOptional({ type: [AtividadeUploadAprDto] })
  @Type(() => AtividadeUploadAprDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  aprs?: AtividadeUploadAprDto[];

  @ApiPropertyOptional({ type: [AtividadeUploadPhotoDto] })
  @Type(() => AtividadeUploadPhotoDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  fotos?: AtividadeUploadPhotoDto[];
}

export class AtividadeUploadResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 10 })
  atividadeExecucaoId!: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  atividadeUuid!: string;

  @ApiProperty({ example: false })
  alreadyExisted!: boolean;

  @ApiProperty({ example: 3 })
  savedPhotos!: number;
}
