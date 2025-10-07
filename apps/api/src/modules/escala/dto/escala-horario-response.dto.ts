/**
 * DTO utilizado para expor os horários configurados dentro de uma escala.
 * Mantemos todas as propriedades opcionais documentadas para facilitar o
 * consumo no frontend.
 */

import { ApiProperty } from '@nestjs/swagger';

export class EscalaHorarioResponseDto {
  @ApiProperty({ description: 'Identificador do horário', example: 12 })
  id: number;

  @ApiProperty({
    description: 'Índice do dia dentro do ciclo (0 baseado)',
    example: 3,
  })
  indiceCiclo: number;

  @ApiProperty({
    description: 'Dia da semana (0=domingo ... 6=sábado)',
    example: 5,
    nullable: true,
  })
  diaSemana: number | null;

  @ApiProperty({ description: 'Hora inicial (HH:mm)', example: '07:00', nullable: true })
  horaInicio: string | null;

  @ApiProperty({ description: 'Hora final (HH:mm)', example: '19:00', nullable: true })
  horaFim: string | null;

  @ApiProperty({ description: 'Número de eletricistas necessários', example: 2 })
  eletricistasNecessarios: number;

  @ApiProperty({ description: 'Indica se o dia é folga', example: false })
  folga: boolean;

  @ApiProperty({ description: 'Etiqueta opcional', example: 'Diurno', nullable: true })
  etiqueta: string | null;

  @ApiProperty({ description: 'Offset de rotação aplicado neste horário', example: 0 })
  rotacaoOffset: number;
}
