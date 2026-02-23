import { ApiProperty } from '@nestjs/swagger';

export class SyncDeltaResponseDto<T = any> {
  @ApiProperty({ example: '2026-02-10T12:00:00.000Z' })
  serverTime!: string;

  @ApiProperty({ description: 'Token para usar como since no próximo delta' })
  nextSince!: string;

  @ApiProperty({ description: 'Registros upserted' })
  items!: T[];

  @ApiProperty({ type: [String], description: 'IDs removidos (tombstones)' })
  deletedIds!: string[];
}

export class SyncSnapshotResponseDto<T = any> {
  @ApiProperty({ example: '2026-02-10T00:00:00.000Z' })
  serverTime!: string;

  @ApiProperty({
    nullable: true,
    description: 'Snapshot não usa delta token, sempre null',
    example: null,
  })
  nextSince!: null;

  @ApiProperty({ description: 'Registros da coleção' })
  items!: T[];

  @ApiProperty({
    type: [String],
    description: 'Snapshot não envia tombstones, lista vazia',
  })
  deletedIds!: string[];
}
