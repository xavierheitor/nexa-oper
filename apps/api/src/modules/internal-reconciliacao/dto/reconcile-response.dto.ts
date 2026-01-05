import { ApiProperty } from '@nestjs/swagger';

/**
 * Estatísticas de uma execução de reconciliação
 */
export class ReconcileStatsDto {
  @ApiProperty({ description: 'Número de registros criados', example: 10 })
  created: number;

  @ApiProperty({ description: 'Número de registros atualizados', example: 5 })
  updated: number;

  @ApiProperty({ description: 'Número de turnos fechados', example: 2 })
  closed: number;

  @ApiProperty({ description: 'Número de registros ignorados', example: 0 })
  skipped: number;
}

/**
 * Resposta de uma execução de reconciliação
 */
export class ReconcileResponseDto {
  @ApiProperty({
    description: 'Indica se a execução foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID único da execução',
    example: 'run-1234567890',
  })
  runId: string;

  @ApiProperty({
    description: 'Data/hora de início da execução (ISO string)',
    example: '2024-01-15T10:00:00Z',
  })
  startedAt: string;

  @ApiProperty({
    description: 'Data/hora de fim da execução (ISO string)',
    example: '2024-01-15T10:05:30Z',
  })
  finishedAt: string;

  @ApiProperty({
    description: 'Duração da execução em milissegundos',
    example: 330000,
  })
  durationMs: number;

  @ApiProperty({
    description: 'Estatísticas da execução',
    type: ReconcileStatsDto,
  })
  stats: ReconcileStatsDto;

  @ApiProperty({
    description: 'Lista de avisos gerados durante a execução',
    type: [String],
    example: [],
  })
  warnings: string[];
}
