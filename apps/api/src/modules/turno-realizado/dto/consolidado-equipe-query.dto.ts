import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

export class ConsolidadoEquipeQueryDto {
  @ApiProperty({
    description: 'ID da equipe',
    example: 1,
  })
  @Type(() => Number)
  equipeId: number;

  @ApiProperty({
    description: 'Data inicial do período (ISO date string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({
    description: 'Data final do período (ISO date string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsDateString()
  dataFim: string;
}
