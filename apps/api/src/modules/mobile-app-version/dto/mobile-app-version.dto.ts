import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMobileAppVersionDto {
  @ApiProperty({ description: 'Versão do aplicativo', example: '1.2.0' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  versao!: string;

  @ApiProperty({
    description: 'Número de build incremental do aplicativo',
    example: 120,
  })
  @IsInt()
  @Type(() => Number)
  build!: number;

  @ApiPropertyOptional({
    description: 'Plataforma',
    example: 'android',
    enum: ['android', 'ios'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['android', 'ios'])
  plataforma?: string = 'android';

  @ApiPropertyOptional({
    description: 'Notas de lançamento',
    example: 'Correção de bugs.',
  })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ description: 'Ativar imediatamente', example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Executa wipe local controlado no primeiro launch deste build',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  wipeRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Build mínimo suportado para uso geral do aplicativo',
    example: 112,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minSupportedBuild?: number;

  @ApiPropertyOptional({
    description: 'Build mínimo permitido para login',
    example: 112,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minLoginBuild?: number;

  @ApiPropertyOptional({
    description: 'Build mínimo permitido para abertura de turno',
    example: 112,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minOpenTurnoBuild?: number;

  @ApiPropertyOptional({
    description: 'Build mínimo permitido para uploads mobile',
    example: 112,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minUploadBuild?: number;
}

export class UpdateMobileAppVersionDto {
  @ApiPropertyOptional({
    description: 'Notas de lançamento',
    example: 'Correção de bugs.',
  })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiPropertyOptional({ description: 'Status ativo', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;
}

export class MobileAppVersionResponseDto {
  @ApiProperty()
  @IsInt()
  id!: number;

  @ApiProperty()
  @IsString()
  versao!: string;

  @ApiProperty()
  @IsInt()
  build!: number;

  @ApiProperty()
  @IsString()
  plataforma!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string | null;

  @ApiProperty()
  @IsString()
  arquivoUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arquivoPath?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  apkSizeBytes?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sha256?: string | null;

  @ApiProperty()
  @IsBoolean()
  ativo!: boolean;

  @ApiProperty()
  @IsBoolean()
  wipeRequired!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minSupportedBuild?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minLoginBuild?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minOpenTurnoBuild?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minUploadBuild?: number | null;

  @ApiProperty()
  createdAt!: Date;
}
