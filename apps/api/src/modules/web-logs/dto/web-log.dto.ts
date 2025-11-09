import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO para receber logs do client-side
 */
export class WebLogDto {
  @ApiProperty({
    description: 'Mensagem do erro',
    example: '[ErrorHandler] ComponenteNome - Erro ao processar dados',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Contexto onde o erro ocorreu',
    example: 'ComponenteNome',
    required: false,
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({
    description: 'Tipo de ação que estava sendo executada',
    example: 'create',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionType?: string;

  @ApiProperty({
    description: 'Detalhes do erro',
    example: {
      error: 'Error message',
      errorName: 'TypeError',
      errorStack: 'Error: ...\n    at ...',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

