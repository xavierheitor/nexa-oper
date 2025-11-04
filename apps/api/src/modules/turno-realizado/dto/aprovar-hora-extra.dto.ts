import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AcaoAprovacao {
  APROVAR = 'aprovar',
  REJEITAR = 'rejeitar',
}

export class AprovarHoraExtraDto {
  @ApiProperty({
    description: 'Ação a ser executada (aprovar ou rejeitar)',
    enum: AcaoAprovacao,
    example: AcaoAprovacao.APROVAR,
  })
  @IsEnum(AcaoAprovacao)
  acao: AcaoAprovacao;

  @ApiPropertyOptional({
    description: 'Observações sobre a aprovação/rejeição',
    example: 'Aprovado conforme solicitação',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}

