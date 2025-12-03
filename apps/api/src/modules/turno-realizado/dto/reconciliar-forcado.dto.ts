import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class ReconciliarForcadoDto {
  @ApiProperty({
    description: 'Número de dias para buscar no histórico (padrão: 30)',
    example: 30,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  diasHistorico?: number;

  @ApiProperty({
    description: 'Data de início (formato: YYYY-MM-DD). Se não informado, usa diasHistorico a partir de hoje',
    example: '2024-01-01',
    required: false,
  })
  @IsString()
  @IsOptional()
  dataInicio?: string;

  @ApiProperty({
    description: 'Data de fim (formato: YYYY-MM-DD). Se não informado, usa hoje',
    example: '2024-01-31',
    required: false,
  })
  @IsString()
  @IsOptional()
  dataFim?: string;
}

