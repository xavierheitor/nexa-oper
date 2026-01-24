/**
 * DTO para criação de tipos de veículo
 */

import { VALIDATION_CONFIG } from '@common/constants/tipo-veiculo';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTipoVeiculoDto {
  @ApiProperty({
    description: 'Nome do tipo de veículo',
    example: 'Caminhão Basculante',
    minLength: VALIDATION_CONFIG.NOME_MIN_LENGTH,
    maxLength: VALIDATION_CONFIG.NOME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION_CONFIG.NOME_MIN_LENGTH, {
    message: 'Nome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(VALIDATION_CONFIG.NOME_MAX_LENGTH, {
    message: 'Nome deve ter no máximo 255 caracteres',
  })
  nome: string;
}
