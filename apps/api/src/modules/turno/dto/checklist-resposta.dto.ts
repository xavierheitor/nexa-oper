/**
 * DTOs para respostas de checklist
 *
 * Este arquivo define os DTOs para validação e transferência de dados
 * relacionados às respostas individuais de perguntas de checklist.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsString, IsDateString } from 'class-validator';

/**
 * DTO para resposta individual de uma pergunta do checklist
 */
export class ChecklistRespostaDto {
  @ApiProperty({
    description: 'ID da pergunta respondida',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  perguntaId: number;

  @ApiProperty({
    description: 'ID da opção de resposta escolhida',
    example: 2,
  })
  @IsNotEmpty()
  @IsInt()
  opcaoRespostaId: number;

  @ApiProperty({
    description: 'Data e hora da resposta',
    example: '2025-10-22T20:10:27.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  dataResposta: string;
}

/**
 * DTO para resposta de checklist com informações adicionais
 */
export class ChecklistRespostaResponseDto {
  @ApiProperty({ description: 'ID da resposta' })
  id: number;

  @ApiProperty({ description: 'ID da pergunta' })
  perguntaId: number;

  @ApiProperty({ description: 'ID da opção de resposta' })
  opcaoRespostaId: number;

  @ApiProperty({ description: 'Data da resposta' })
  dataResposta: Date;

  @ApiProperty({ description: 'Se a resposta aguarda foto' })
  aguardandoFoto: boolean;

  @ApiProperty({ description: 'Quantidade de fotos sincronizadas' })
  fotosSincronizadas: number;

  @ApiProperty({ description: 'Nome da pergunta' })
  pergunta?: string;

  @ApiProperty({ description: 'Nome da opção de resposta' })
  opcaoResposta?: string;

  @ApiProperty({ description: 'Se a opção gera pendência' })
  geraPendencia?: boolean;
}
