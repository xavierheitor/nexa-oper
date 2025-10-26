/**
 * DTO para receber os metadados do upload de fotos mobile.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SUPPORTED_MOBILE_PHOTO_TYPES } from '../constants/mobile-upload.constants';

export class PhotoUploadDto {
  @ApiProperty({
    description: 'Identificador local do turno no aplicativo',
    example: 123,
  })
  @Type(() => Number)
  @IsInt()
  turnoId!: number;

  @ApiProperty({
    description: 'Tipo da foto conforme enum utilizado pelo aplicativo',
    example: 'servico',
    enum: SUPPORTED_MOBILE_PHOTO_TYPES,
  })
  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @ApiPropertyOptional({
    description: 'Identificador do checklist preenchido relacionado à foto',
    example: 987,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  checklistPreenchidoId?: number;

  @ApiPropertyOptional({
    description: 'Identificador da resposta do checklist relacionada à foto',
    example: 654,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  checklistRespostaId?: number;

  @ApiPropertyOptional({
    description: 'Sequência da assinatura (1 ou 2) quando aplicável',
    example: 1,
    minimum: 1,
    maximum: 2,
  })
  @Type(() => Number)
  @Transform(({ value }) => (value === 0 ? undefined : value))
  @IsInt()
  @Min(1, { message: 'sequenciaAssinatura must not be less than 1' })
  @Max(2)
  @IsOptional()
  sequenciaAssinatura?: number;

  @ApiPropertyOptional({
    description: 'Identificador remoto do serviço associado à foto',
    example: 456,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  servicoId?: number;
}
