/**
 * DTO para receber os metadados do upload de fotos mobile.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { SUPPORTED_MOBILE_PHOTO_TYPES } from '@common/constants/mobile-upload';

export class PhotoUploadDto {
  @ApiProperty({
    description: 'Identificador do turno na API (remoteId do app)',
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
    description: 'UUID único do checklist preenchido (gerado pelo app mobile)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  checklistUuid?: string;

  @ApiPropertyOptional({
    description:
      'ID remoto da pergunta que gerou a pendência (enviado como checklistPerguntaId pelo app)',
    example: 654,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  checklistPerguntaId?: number;

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
