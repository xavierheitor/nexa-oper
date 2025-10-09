/**
 * DTO para atualização de eletricistas
 */

import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { CreateEletricistaDto } from './create-eletricista.dto';

export class UpdateEletricistaDto extends PartialType(CreateEletricistaDto) {
  @ApiProperty({ description: 'ID do eletricista', example: 101 })
  @Type(() => Number)
  @IsInt({ message: 'ID deve ser um número inteiro' })
  @IsPositive({ message: 'ID deve ser positivo' })
  id: number;
}
