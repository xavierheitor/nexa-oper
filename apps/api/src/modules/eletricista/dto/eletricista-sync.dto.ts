/**
 * DTO para sincronização de eletricistas
 *
 * Define a estrutura de dados retornada para clientes mobile
 * que necessitam sincronizar a base completa de eletricistas
 * com informações de auditoria.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUppercase,
  Length,
  Matches,
} from 'class-validator';

/**
 * DTO para sincronização de eletricistas
 */
export class EletricistaSyncDto {
  @ApiProperty({ description: 'ID do eletricista', example: 101 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome do eletricista', example: 'João Silva' })
  @IsString()
  @Length(2, 100)
  nome: string;

  @ApiProperty({
    description: 'Matrícula do eletricista',
    example: 'ELT001',
  })
  @IsString()
  @Length(3, 20)
  matricula: string;

  @ApiProperty({
    description: 'Telefone do eletricista',
    example: '(11) 99999-9999',
  })
  @IsString()
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  telefone: string;

  @ApiProperty({
    description: 'Estado onde o eletricista atua',
    example: 'SP',
    enum: ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'],
  })
  @IsString()
  @IsUppercase()
  @Length(2, 2)
  estado: string;

  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  contratoId: number;

  @ApiProperty({
    description: 'Data de criação do eletricista',
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
  updatedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string | null;

  @ApiPropertyOptional({
    description: 'Data da exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string | null;
}
