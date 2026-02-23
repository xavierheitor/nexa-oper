import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/**
 * Uma resposta do checklist (pergunta + opção escolhida).
 */
export class ChecklistRespostaItemDto {
  @ApiProperty({ description: 'ID da pergunta', example: 1 })
  @IsInt()
  @IsPositive()
  perguntaId!: number;

  @ApiProperty({ description: 'ID da opção de resposta escolhida', example: 2 })
  @IsInt()
  @IsPositive()
  opcaoRespostaId!: number;
}

/**
 * Checklist preenchido enviado na abertura do turno.
 */
export class ChecklistPreenchidoItemDto {
  @ApiProperty({
    description: 'UUID único gerado pelo app mobile',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  uuid!: string;

  @ApiProperty({ description: 'ID do checklist (modelo)', example: 1 })
  @IsInt()
  @IsPositive()
  checklistId!: number;

  @ApiProperty({ description: 'ID do eletricista que preencheu', example: 42 })
  @IsInt()
  @IsPositive()
  eletricistaId!: number;

  @ApiPropertyOptional({ description: 'Latitude no preenchimento' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude no preenchimento' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Respostas (pergunta + opção)',
    type: [ChecklistRespostaItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistRespostaItemDto)
  respostas!: ChecklistRespostaItemDto[];
}
