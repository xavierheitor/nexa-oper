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
  @IsString()
  plataforma!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string | null;

  @ApiProperty()
  @IsString()
  arquivoUrl!: string;

  @ApiProperty()
  @IsBoolean()
  ativo!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
