/**
 * DTO para resposta individual de tipos de veículo
 *
 * Define a estrutura de dados retornada em respostas
 * individuais de tipos de veículo.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO para resposta individual de tipos de veículo
 */
export class TipoVeiculoResponseDto {
  @ApiProperty({ description: 'ID do tipo de veículo', example: 1 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome do tipo de veículo', example: 'Caminhão Basculante' })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Data de criação do tipo de veículo',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário responsável pela criação',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-02-01T08:15:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Data da exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
