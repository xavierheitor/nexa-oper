import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * DTO para PATCH :id/fechar — turnoId vem da rota, body pode omitir.
 */
export class FecharTurnoDto {
  @ApiPropertyOptional({
    description: 'ID do turno a ser fechado',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  turnoId?: number;

  @ApiPropertyOptional({ description: 'Quilometragem final', example: 12400 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  kmFim?: number;

  @ApiPropertyOptional({
    description: 'Data/hora de fechamento (ISO)',
    example: '2025-12-31T18:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataFim?: Date;

  @ApiPropertyOptional({
    description: 'Alias para kmFim (compatibilidade mobile)',
    example: 12400,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  kmFinal?: number;

  @ApiPropertyOptional({
    description: 'Alias para dataFim (compatibilidade mobile)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  horaFim?: Date;

  @ApiPropertyOptional({ description: 'Latitude no fechamento' })
  @IsOptional()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude no fechamento' })
  @IsOptional()
  longitude?: string;
}

/**
 * DTO para POST /fechar — turnoId é obrigatório no body (compatibilidade mobile).
 * Demais campos iguais a FecharTurnoDto (opcionais).
 */
export class FecharTurnoPostDto {
  @ApiProperty({
    description: 'ID do turno a ser fechado',
    example: 123,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  turnoId!: number;

  @ApiPropertyOptional({ description: 'Quilometragem final', example: 12400 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  kmFim?: number;

  @ApiPropertyOptional({
    description: 'Data/hora de fechamento (ISO)',
    example: '2025-12-31T18:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataFim?: Date;

  @ApiPropertyOptional({
    description: 'Alias para kmFim (compatibilidade mobile)',
    example: 12400,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  kmFinal?: number;

  @ApiPropertyOptional({
    description: 'Alias para dataFim (compatibilidade mobile)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  horaFim?: Date;

  @ApiPropertyOptional({ description: 'Latitude no fechamento' })
  @IsOptional()
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude no fechamento' })
  @IsOptional()
  longitude?: string;
}
