import { ApiProperty } from '@nestjs/swagger';

export type SyncMode = 'snapshot' | 'delta';

export class SyncManifestCollectionDto {
  @ApiProperty({ example: 'eletricista' })
  name!: string;

  @ApiProperty({ example: 'c=42|u=2026-02-09T12:00:00.000Z|d=' })
  etag!: string;

  @ApiProperty({ enum: ['snapshot', 'delta'] })
  mode!: SyncMode;
}

export class SyncManifestDto {
  @ApiProperty({
    example: '2026-02-10T00:00:00.000Z',
    description: 'ISO do servidor',
  })
  serverTime!: string;

  @ApiProperty({
    description: 'Hash do scope (muda quando permissões/contratos mudam)',
  })
  scopeHash!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Mapa de coleções com etag e modo (ex: eletricista, equipe, veiculo)',
  })
  collections!: Record<string, SyncManifestCollectionDto>;
}
