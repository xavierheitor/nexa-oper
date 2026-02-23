import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoDetalheDto } from './turno-detalhe.dto';

/**
 * Payload retornado por POST /turno/abrir (campo `data` do envelope).
 */
export class AbrirTurnoResponseDto extends TurnoDetalheDto {
  @ApiProperty({
    description: 'ID do turno (alias para compatibilidade mobile)',
    example: 123,
  })
  remoteId!: number;

  @ApiProperty({
    description: 'Quantidade de checklists salvos na abertura',
    example: 2,
  })
  checklistsSalvos!: number;

  @ApiPropertyOptional({
    description: 'IDs de respostas aguardando foto (processamento assíncrono)',
    type: [Number],
    isArray: true,
  })
  respostasAguardandoFoto?: number[];

  @ApiPropertyOptional({
    description: 'Indicador de processamento assíncrono em andamento',
    example: 'Em andamento',
  })
  processamentoAssincrono?: string;
}
