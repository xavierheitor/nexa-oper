import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta do endpoint de status de sincronização (checksum).
 * Usado por APR, Checklist, Equipe e Eletricista sync.
 */
export class SyncStatusResponseDto {
  @ApiProperty({
    description: 'Indica se houve mudanças desde a última sincronização; false dispensa download',
    example: true,
  })
  changed: boolean;

  @ApiProperty({
    description: 'Checksum SHA-256 do payload de sync no servidor',
    example: 'a1b2c3d4e5f6...',
  })
  checksum: string;

  @ApiProperty({
    description: 'Data/hora do servidor em ISO 8601; pode ser usada como since na próxima incremental',
    example: '2025-01-24T12:00:00.000Z',
    format: 'date-time',
  })
  serverTime: string;
}
