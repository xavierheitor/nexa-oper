import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

enum InspecaoSegurancaContextoDto {
  GERAL = 'GERAL',
  COLABORADOR = 'COLABORADOR',
  EPC = 'EPC',
  VEICULO = 'VEICULO',
}

enum InspecaoSegurancaEvidenciaTipoDto {
  PROBLEMA = 'PROBLEMA',
  TRATAMENTO = 'TRATAMENTO',
}

export class InspecaoSegurancaUploadPhotoDto {
  @ApiPropertyOptional({ example: 'resposta-1-problema' })
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

  @ApiPropertyOptional({ example: 'inspecao.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: '2026-07-15T12:00:00.000Z' })
  @IsOptional()
  @IsString()
  capturedAt?: string;

  @ApiPropertyOptional({
    enum: InspecaoSegurancaEvidenciaTipoDto,
    default: InspecaoSegurancaEvidenciaTipoDto.PROBLEMA,
  })
  @IsOptional()
  @IsEnum(InspecaoSegurancaEvidenciaTipoDto)
  tipo?: InspecaoSegurancaEvidenciaTipoDto;
}

export class InspecaoSegurancaUploadRespostaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  respostaUuid?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  grupoPerguntaId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  perguntaId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  opcaoRespostaId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grupoNomeSnapshot?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  perguntaNomeSnapshot!: string;

  @ApiProperty({ example: 'opcao' })
  @IsString()
  @IsNotEmpty()
  tipoRespostaSnapshot!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  opcaoRespostaNomeSnapshot?: string | null;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataResposta?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  geraPendenciaSnapshot?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  exigeFotoSnapshot?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sanadaEmCampo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacaoProblema?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacaoTratamento?: string | null;

  @ApiPropertyOptional({ type: [InspecaoSegurancaUploadPhotoDto] })
  @Type(() => InspecaoSegurancaUploadPhotoDto)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  fotos?: InspecaoSegurancaUploadPhotoDto[];
}

export class InspecaoSegurancaUploadDto {
  @ApiProperty()
  @IsUUID()
  inspecaoUuid!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnoId!: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  modeloId?: number | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  tipoId?: number | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modeloNomeSnapshot!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoNomeSnapshot!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoChaveSnapshot!: string;

  @ApiProperty({ enum: InspecaoSegurancaContextoDto })
  @IsEnum(InspecaoSegurancaContextoDto)
  contextoSnapshot!: InspecaoSegurancaContextoDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspetorNomeSnapshot?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colaboradorNomeSnapshot?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  epcNomeSnapshot?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placaVeiculoSnapshot?: string | null;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  veiculoId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string | null;

  @ApiPropertyOptional({ example: '2026-07-15T12:00:00.000Z' })
  @IsOptional()
  @IsString()
  realizadaEm?: string;

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

  @ApiProperty({ type: [InspecaoSegurancaUploadRespostaDto] })
  @Type(() => InspecaoSegurancaUploadRespostaDto)
  @IsArray()
  @ValidateNested({ each: true })
  respostas!: InspecaoSegurancaUploadRespostaDto[];
}

export class InspecaoSegurancaUploadResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  inspecaoUuid!: string;

  @ApiProperty()
  alreadyExisted!: boolean;

  @ApiProperty()
  respostasSalvas!: number;

  @ApiProperty()
  pendenciasGeradas!: number;

  @ApiProperty()
  evidenciasSalvas!: number;
}
